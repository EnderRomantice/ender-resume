/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RigidBodyProps
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// Assets are served from /public so no bundler/loader config is needed.
const CARD_GLB = '/lanyard/card.glb';
const LANYARD_TEXTURE = '/lanyard/lanyard.png';
// 1x1 transparent pixel — used as a placeholder so useTexture can be called
// unconditionally even when a front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half, so the two faces render
// independently. `fit: 'cover'` preserves aspect ratio (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };
type InteractionZone = { x: number; y: number; w: number; h: number; active: boolean; dragging: boolean };
type InteractionApi = {
  setDragging: (dragging: boolean) => void;
  setZone: (zone: Omit<InteractionZone, 'dragging'>) => void;
};

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  onPull?: () => void;
  passThrough?: boolean;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  onPull,
  passThrough = false
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  // Guards against re-entry: a forwarded click bubbles to the document where R3F's
  // own miss handler would catch it and re-trigger onPointerMissed in a loop.
  const forwardingClick = useRef(false);
  // The badge's live screen-space box (updated each frame by <Band>). In
  // passThrough mode the canvas only captures pointer events when the cursor is
  // inside this box (or a drag is in progress), so hover/clicks pass through to
  // the page everywhere else.
  const interaction = useRef<InteractionZone>({ x: 0, y: 0, w: 0, h: 0, active: false, dragging: false });
  const interactionApi = useMemo<InteractionApi>(
    () => ({
      setDragging: (dragging: boolean) => {
        interaction.current = { ...interaction.current, dragging };
      },
      setZone: (zone: Omit<InteractionZone, 'dragging'>) => {
        interaction.current = { ...interaction.current, ...zone };
      },
    }),
    []
  );
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!passThrough) return;
    const setCanvasHitTesting = (enabled: boolean): void => {
      const el = canvasElRef.current;
      if (el) el.style.pointerEvents = enabled ? 'auto' : 'none';
    };
    const onMove = (ev: PointerEvent): void => {
      const z = interaction.current;
      const inside =
        z.active && ev.clientX >= z.x && ev.clientX <= z.x + z.w && ev.clientY >= z.y && ev.clientY <= z.y + z.h;
      setCanvasHitTesting(inside || z.dragging);
    };
    const onPointerUp = (): void => {
      interaction.current = { ...interaction.current, dragging: false };
      setCanvasHitTesting(false);
    };
    const onBlur = (): void => setCanvasHitTesting(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [passThrough]);

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        // In passThrough mode the canvas itself stays interactive (so the badge
        // drags reliably in every browser), but a click that MISSES the badge is
        // re-dispatched to the element underneath — so the page stays usable.
        onPointerMissed={
          passThrough
            ? (e: MouseEvent) => {
                if (typeof document === 'undefined' || forwardingClick.current) return;
                const target = e.target as HTMLElement | null;
                // Disable the whole lanyard overlay for one hit-test so we can find
                // the element underneath and re-dispatch the click to it.
                const wrapper = target?.closest?.('.lanyard-wrapper') as HTMLElement | null;
                const overlay = (wrapper?.parentElement as HTMLElement | null) ?? wrapper;
                if (!overlay) return;
                // Walk the full stack at the point and take the first element that
                // isn't part of the lanyard overlay — that's the page underneath.
                const stack = document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[];
                const below = stack.find((el) => !overlay.contains(el));
                if (below) {
                  forwardingClick.current = true;
                  below.dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: e.clientX, clientY: e.clientY })
                  );
                  forwardingClick.current = false;
                }
              }
            : undefined
        }
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1);
          if (passThrough) {
            canvasElRef.current = gl.domElement;
            gl.domElement.style.pointerEvents = 'none';
          }
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            onPull={onPull}
            interaction={passThrough ? interactionApi : undefined}
          />
          </Physics>
          <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  onPull?: () => void;
  interaction?: InteractionApi;
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  onPull,
  interaction
}: BandProps) {
  // Using "any" for refs since the exact types depend on Rapier's internals
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: any = {
    type: 'dynamic' as RigidBodyProps['type'],
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const { nodes, materials } = useGLTF(CARD_GLB) as any;
  const texture = useTexture(lanyardImage || LANYARD_TEXTURE);
  // useTexture must be called unconditionally; use a blank pixel when no image
  // is provided for a given face, and skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image as any;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;
    // Keep the original baked atlas for card edges and any untouched face.
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (
      img: any,
      rect: typeof FRONT_UV_RECT,
      opts: { fit?: 'cover' | 'contain'; scale?: number; background?: string | null } = {}
    ) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const fit = opts.fit ?? imageFit;
      // Paint over the baked atlas art (e.g. the back face's default logo) so the
      // custom image sits on a clean card surface instead of colliding with it.
      if (opts.background) {
        ctx.fillStyle = opts.background;
        ctx.fillRect(rx, ry, rw, rh);
      }
      const pick = fit === 'contain' ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height) * (opts.scale ?? 1);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    // Sample the card's paper colour from a blank spot of the back face so we can
    // cover the baked default logo without guessing at the exact shade.
    const sampleCardBackground = (): string => {
      try {
        const sx = Math.round((BACK_UV_RECT.x + BACK_UV_RECT.w * 0.5) * W);
        const sy = Math.round((BACK_UV_RECT.y + BACK_UV_RECT.h * 0.94) * H);
        const [r, g, b] = ctx.getImageData(sx, sy, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      } catch {
        return '#f2f1ee';
      }
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
    if (backImage && backTex.image) {
      // The back logo is centred and scaled down so it reads as a small badge
      // mark rather than filling (and clashing with) the whole card face.
      drawFitted(backTex.image, BACK_UV_RECT, { fit: 'contain', scale: 0.5, background: sampleCardBackground() });
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);

  const [curve] = useState(
    () => {
      const nextCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      nextCurve.curveType = 'chordal';
      return nextCurve;
    }
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);
  const pullStart = useRef<{ x: number; y: number } | null>(null);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref: any) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
    // Track the badge's screen-space box so the canvas only captures pointer
    // events while the cursor is over it (hover passes through everywhere else).
    if (interaction && card.current) {
      const t = card.current.translation();
      const rect = state.gl.domElement.getBoundingClientRect();
      vec.set(t.x, t.y - 1.2, t.z).project(state.camera);
      const sx = rect.left + (vec.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (vec.y * -0.5 + 0.5) * rect.height;
      dir.set(t.x, t.y - 2.6, t.z).project(state.camera);
      const sy2 = rect.top + (dir.y * -0.5 + 0.5) * rect.height;
      const halfH = Math.min(145, Math.max(58, Math.abs(sy2 - sy) + 14));
      const halfW = halfH * 0.52;
      interaction.setZone({
        x: sx - halfW,
        y: sy - halfH,
        w: halfW * 2,
        h: halfH * 2,
        active: true,
      });
    }
  });

  useEffect(() => {
    // Three textures are mutable runtime objects; Rapier/R3F expects this setup in-place.
    // eslint-disable-next-line react-hooks/immutability
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              try {
                e.target.releasePointerCapture(e.pointerId);
              } catch {
                /* target may not support capture in passThrough mode */
              }
              // Optional "pull" callback when the badge is dragged a meaningful distance.
              if (pullStart.current && onPull) {
                const dx = e.clientX - pullStart.current.x;
                const dy = e.clientY - pullStart.current.y;
                if (Math.hypot(dx, dy) > 40) onPull();
              }
              pullStart.current = null;
              drag(false);
              interaction?.setDragging(false);
              // Re-enable text selection (disabled during drag — see onPointerDown)
              // and clear any stray selection the pass-through drag may have started.
              if (typeof document !== 'undefined') {
                document.body.style.userSelect = '';
                window.getSelection?.()?.removeAllRanges?.();
              }
            }}
            onPointerDown={(e: any) => {
              try {
                e.target.setPointerCapture(e.pointerId);
              } catch {
                /* target may not support capture in passThrough mode */
              }
              // In passThrough mode the drag also reaches the page underneath, which
              // would start a text selection and selection-auto-scroll. Suppress it
              // via user-select (preventDefault here would break the drag itself).
              if (typeof document !== 'undefined') document.body.style.userSelect = 'none';
              interaction?.setDragging(true);
              pullStart.current = { x: e.clientX, y: e.clientY };
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={1}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB);
