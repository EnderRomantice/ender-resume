// Register the meshline objects added via `extend()` so JSX recognises them.
// Typed loosely (matching react-bits' own usage) to avoid fighting the
// constructor-argument inference from the meshline classes.
declare module '@react-three/fiber' {
  interface ThreeElements {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meshLineGeometry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meshLineMaterial: any;
  }
}

export {};
