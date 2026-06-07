import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The Creatorone logo is an SVG served from /public.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
