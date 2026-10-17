import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { About } from "@/components/sections/About";
import { Contacts } from "@/components/sections/Contacts";
import { Hero } from "@/components/sections/Hero";
import { OrderForm } from "@/components/sections/OrderForm";
import { Products } from "@/components/sections/Products";
import { siteDescription, siteTitle } from "@/lib/site";

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
