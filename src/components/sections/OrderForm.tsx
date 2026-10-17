import { LeadForm } from "@/components/LeadForm";

export function OrderForm() {
  return (
    <section
      id="order"
      className="scroll-mt-6 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-16"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <h2 className="font-display max-w-2xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Оформить заказ
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Оставьте заявку, и мы свяжемся с вами в течение получаса для
          подтверждения.
        </p>

        <div className="mt-10 max-w-xl">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
