import "@copilotkit/react-ui/styles.css";
import "./globals.css";

import { CopilotKit } from "@copilotkit/react-core";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pretty Bouquet",
  description: "Design a Mother's Day flower card.",
};

// `maximum-scale=1` is what actually stops iOS Safari from auto-zooming
// when an input gets focus, even though our inputs are already 16px+.
// The 16px-min CSS rule is a belt; this is the suspenders.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600&family=Bricolage+Grotesque:opsz,wght@10..48,400;10..48,600;10..48,700&family=Instrument+Serif:ital@0;1&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Caveat:wght@400;500;700&family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="weatherAgent"
          enableInspector={false}
        >
          {children}
        </CopilotKit>
        <Script
          defer
          src="https://analytics.jakubzika.com/script.js"
          data-website-id="4fe7251c-18bf-4bcf-8516-27ee39a0476b"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
