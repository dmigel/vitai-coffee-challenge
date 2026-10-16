import { About } from "@/components/sections/About";
import { Contacts } from "@/components/sections/Contacts";
import { Hero } from "@/components/sections/Hero";
import { OrderForm } from "@/components/sections/OrderForm";
import { Products } from "@/components/sections/Products";

export default function Home() {
  return (
    <main>
      <Hero />
      <Products />
      <About />
      <OrderForm />
      <Contacts />
    </main>
  );
}
