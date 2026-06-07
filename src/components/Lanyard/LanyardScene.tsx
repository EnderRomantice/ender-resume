'use client';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

// WebGL must run on the client only — never server-render the Canvas.
const Lanyard = dynamic(() => import('./Lanyard'), { ssr: false });

export default function LanyardScene(props: ComponentProps<typeof Lanyard>) {
  return <Lanyard {...props} />;
}
