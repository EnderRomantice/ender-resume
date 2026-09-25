import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { cormorant, greatVibes, instrumentSans } from "./fonts";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ender — Full-Stack & AI Application Developer",
  description:
    "Ender builds full-stack AI applications with React, Next.js, NestJS, agent workflows, and open-source developer tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${cormorant.variable} ${greatVibes.variable} ${geistMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
