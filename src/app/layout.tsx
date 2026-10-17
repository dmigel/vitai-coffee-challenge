import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";

import { UtmCapture } from "@/components/UtmCapture";
import {
  getSiteUrl,
  siteDescription,
  siteName,
  siteTitle,
} from "@/lib/site";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
  variable: "--font-manrope",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
  display: "swap",
  variable: "--font-unbounded",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "ru_BY",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${siteName} — свежеобжаренный кофе в Минске`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${manrope.variable} ${unbounded.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}
      >
        <UtmCapture />
        {children}
      </body>
    </html>
  );
}
