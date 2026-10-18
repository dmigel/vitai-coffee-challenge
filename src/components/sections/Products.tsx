import Image from "next/image";

import { ProductOrderButton } from "@/components/ProductOrderButton";
import { products, type Product } from "@/data/products";

const topRow = products.filter(
  (p) => p.id === "ethiopia" || p.id === "colombia" || p.id === "brazil",
);
const bottomRow = products.filter(
  (p) => p.id === "drip" || p.id === "subscription",
);

function formatPrice(product: Product) {
  const base = `${product.price} ${product.currency}`;
  return product.priceSuffix ? `${base} ${product.priceSuffix}` : base;
}

function ProductCard({ product }: { product: Product }) {
  const isPromo = product.kind === "subscription";

  return (
    <article
      className={
        isPromo
          ? "product-card product-card--promo flex h-full flex-col rounded-lg border-2 border-accent bg-white p-5 sm:p-6"
          : "product-card flex h-full flex-col rounded-lg bg-white p-5 sm:p-6"
      }
    >
      <div className="relative mx-auto h-56 w-full max-w-[15rem] sm:h-64 sm:max-w-[17rem]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="272px"
          className="object-contain"
          placeholder="blur"
        />
        {product.badge ? (
          <span className="product-badge absolute -right-2 -top-2 z-10 rounded px-2.5 py-1 text-xs font-bold text-white sm:-right-3 sm:text-sm">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
          {product.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted sm:text-base">
          {product.description}
        </p>

        {product.bonus ? (
          <p className="mt-3 text-sm font-medium text-accent sm:text-base">
            {product.bonus}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{product.volume}</p>
            <p className="font-display mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
              {formatPrice(product)}
            </p>
          </div>
          <ProductOrderButton
            interestType={product.interestType}
            productId={product.id}
            className={isPromo ? "product-cta product-cta--promo" : "product-cta"}
          >
            {product.ctaLabel}
          </ProductOrderButton>
        </div>
      </div>
    </article>
  );
}

export function Products() {
  return (
    <section
      id="products"
      className="scroll-mt-6 bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-16"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <h2 className="font-display max-w-2xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Продукция и акции
        </h2>
        <div className="mt-10 md:grid md:grid-cols-4 lg:gap-8 md:gap-6 lg:block">
          <ul className="grid list-none grid-cols-1 gap-7 p-0 md:contents lg:grid lg:grid-cols-3 lg:gap-8">
            {topRow.map((product) => (
              <li key={product.id} className="md:col-span-2 lg:col-span-1">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>

          <div className="mt-7 md:contents lg:mt-8 lg:block">
            <ul className="grid list-none grid-cols-1 gap-7 p-0 md:contents lg:grid lg:grid-cols-[repeat(2,calc((100%-4rem)/3))] lg:justify-center lg:gap-8">
              {bottomRow.map((product, i) => (
                <li
                  key={product.id}
                  className={
                    i === bottomRow.length - 1
                      ? "md:col-span-2 md:col-start-2 lg:col-span-1 lg:col-start-auto"
                      : "md:col-span-2 lg:col-span-1"
                  }
                >
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}