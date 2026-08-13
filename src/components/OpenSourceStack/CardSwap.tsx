"use client";

import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";
import styles from "./CardSwap.module.css";

type CardSwapProps = {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  children: ReactNode;
};

type CardProps = React.HTMLAttributes<HTMLDivElement> & { customClass?: string };

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, className, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`${styles.card} ${customClass ?? ""} ${className ?? ""}`.trim()} />
));
Card.displayName = "Card";

type CardRef = RefObject<HTMLDivElement | null>;
type Slot = { x: number; y: number; z: number; zIndex: number };

const makeSlot = (index: number, distanceX: number, distanceY: number, total: number): Slot => ({
  x: index * distanceX,
  y: -index * distanceY,
  z: -index * distanceX * 1.5,
  zIndex: total - index,
});

function placeNow(element: HTMLElement, slot: Slot, skew: number) {
  gsap.set(element, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
}

export default function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  skewAmount = 2,
  easing = "elastic",
  children,
}: CardSwapProps) {
  const config = easing === "elastic"
    ? { ease: "elastic.out(0.6,0.9)", drop: 2, move: 2, back: 2, overlap: 0.9, returnDelay: 0.05 }
    : { ease: "power1.inOut", drop: 0.8, move: 0.8, back: 0.8, overlap: 0.45, returnDelay: 0.2 };
  const childArray = useMemo(() => Children.toArray(children) as ReactElement<CardProps>[], [children]);
  const refs = useMemo<CardRef[]>(() => childArray.map(() => React.createRef<HTMLDivElement>()), [childArray]);
  const order = useRef(Array.from({ length: childArray.length }, (_, index) => index));

  useEffect(() => {
    const total = refs.length;
    refs.forEach((ref, index) => {
      if (ref.current) placeNow(ref.current, makeSlot(index, cardDistance, verticalDistance, total), skewAmount);
    });

    let timeline: gsap.core.Timeline | null = null;
    const swap = () => {
      if (order.current.length < 2) return;
      const [front, ...rest] = order.current;
      const frontElement = refs[front].current;
      if (!frontElement) return;

      timeline?.kill();
      timeline = gsap.timeline();
      timeline.to(frontElement, { y: "+=500", duration: config.drop, ease: config.ease });
      timeline.addLabel("promote", `-=${config.drop * config.overlap}`);
      rest.forEach((index, slotIndex) => {
        const element = refs[index].current;
        if (!element) return;
        const slot = makeSlot(slotIndex, cardDistance, verticalDistance, total);
        timeline?.set(element, { zIndex: slot.zIndex }, "promote");
        timeline?.to(element, { x: slot.x, y: slot.y, z: slot.z, duration: config.move, ease: config.ease }, `promote+=${slotIndex * 0.15}`);
      });
      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      timeline.addLabel("return", `promote+=${config.move * config.returnDelay}`);
      timeline.call(() => gsap.set(frontElement, { zIndex: backSlot.zIndex }), undefined, "return");
      timeline.to(frontElement, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.back, ease: config.ease }, "return");
      timeline.call(() => { order.current = [...rest, front]; });
    };

    const interval = window.setInterval(swap, delay);
    return () => {
      window.clearInterval(interval);
      timeline?.kill();
    };
  }, [cardDistance, config.back, config.drop, config.ease, config.move, config.overlap, config.returnDelay, delay, refs, skewAmount, verticalDistance]);

  return (
    <div className={styles.swap} style={{ width, height }} aria-live="off">
      {childArray.map((child, index) => isValidElement<CardProps>(child)
        ? cloneElement(child, {
            key: index,
            ref: refs[index],
            style: { width, height, ...child.props.style },
          } as CardProps & React.RefAttributes<HTMLDivElement>)
        : child)}
    </div>
  );
}
