import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/wayline",
        destination: "https://wayline-teal.vercel.app",
        permanent: true,
      },
    ];
  },
  images: {
    // The Creatorone logo is an SVG served from /public.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
