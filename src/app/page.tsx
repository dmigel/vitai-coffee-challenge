import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { About } from "@/components/sections/About";
import { Contacts } from "@/components/sections/Contacts";
import { Hero } from "@/components/sections/Hero";
import { OrderForm } from "@/components/sections/OrderForm";
import { Products } from "@/components/sections/Products";
import {
  getOgImageUrl,
  siteDescription,
  siteName,
  siteTitle,
} from "@/lib/site";

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: ogImage,
        secureUrl: ogImage,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: `${siteName} — свежеобжаренный кофе в Минске`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImage],
  },
};

export default function Home() {
  return (
    <>
      <JsonLd />
      <main>
        <Hero />
        <Products />
        <About />
        <OrderForm />
        <Contacts />
      </main>
    </>
  );
}
