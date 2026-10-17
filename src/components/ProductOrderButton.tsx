"use client";

import type { ReactNode } from "react";

import {
  ORDER_SELECTION_PARAMS,
  type InterestTypeFromProduct,
  type ProductId,
} from "@/data/products";

type ProductOrderButtonProps = {
  interestType: InterestTypeFromProduct;
  productId: ProductId;
  children: ReactNode;
  className?: string;
};

function buildOrderHref(interestType: InterestTypeFromProduct, productId: ProductId) {
  const params = new URLSearchParams({
    [ORDER_SELECTION_PARAMS.interestType]: interestType,
    [ORDER_SELECTION_PARAMS.product]: productId,
  });
  return `?${params.toString()}#order`;
}

function selectAndScrollToOrder(
  interestType: InterestTypeFromProduct,
  productId: ProductId,
) {
  const url = new URL(window.location.href);
  url.searchParams.set(ORDER_SELECTION_PARAMS.interestType, interestType);
  url.searchParams.set(ORDER_SELECTION_PARAMS.product, productId);
  url.hash = "order";
  window.history.pushState(null, "", url);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  document.getElementById("order")?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

export function ProductOrderButton({
  interestType,
  productId,
  children,
  className,
}: ProductOrderButtonProps) {
  return (
    <a
      href={buildOrderHref(interestType, productId)}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        selectAndScrollToOrder(interestType, productId);
      }}
    >
      {children}
    </a>
  );
}
