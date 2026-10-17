import type { StaticImageData } from "next/image";

import img1 from "@/assets/1.jpg";
import img2 from "@/assets/2.jpg";
import img3 from "@/assets/3.jpg";
import img4 from "@/assets/4.jpg";
import img5 from "@/assets/5.jpg";

/**
 * Предвыбор из карточек Products → форма #order
 *
 * Кнопки пишут в URL search-параметры (существующие UTM и др. сохраняются)
 * и ставят hash `#order`, затем скроллят к секции:
 *
 *   ?interest_type=one_time&product=ethiopia#order
 *   ?interest_type=subscription&product=subscription#order
 *
 * Параметры:
 *   interest_type — "one_time" | "subscription" (из карточки; "question" форма выставит сама)
 *   product       — ProductId выбранной карточки
 *
 * Правила (SPEC): one_time → продукт обязателен и не "subscription";
 * subscription → product всегда "subscription".
 *
 * Форма читает `interest_type` и `product` из `window.location.search`
 * при монтировании, popstate / hashchange и событии `kvarta:order-prefill`,
 * и подставляет значения в поля. URL — общий канал передачи выбора.
 */

export type ProductId =
  | "ethiopia"
  | "colombia"
  | "brazil"
  | "drip"
  | "subscription";

export type ProductKind = "pack" | "subscription";

export type InterestTypeFromProduct = "one_time" | "subscription";

export type Product = {
  id: ProductId;
  name: string;
  description: string;
  volume: string;
  price: number;
  /** Подпись валюты — всегда «BYN». */
  currency: "BYN";
  /** Доп. хвост цены, напр. «/ мес.» у подписки. */
  priceSuffix?: string;
  image: StaticImageData;
  kind: ProductKind;
  badge?: string;
  bonus?: string;
  ctaLabel: string;
  interestType: InterestTypeFromProduct;
};

export const ORDER_SELECTION_PARAMS = {
  interestType: "interest_type",
  product: "product",
} as const;

export const products: Product[] = [
  {
    id: "ethiopia",
    name: "Эфиопия Иргачеффе",
    description:
      "Цветочный аромат, ноты бергамота, светлая обжарка. Идеально для фильтра и френч-пресса.",
    volume: "250 г",
    price: 32,
    currency: "BYN",
    image: img1,
    kind: "pack",
    ctaLabel: "Заказать",
    interestType: "one_time",
  },
  {
    id: "colombia",
    name: "Колумбия Уила",
    description:
      "Сбалансированный вкус с нотами карамели и спелого красного яблока. Универсальный сорт.",
    volume: "250 г",
    price: 29,
    currency: "BYN",
    image: img2,
    kind: "pack",
    ctaLabel: "Заказать",
    interestType: "one_time",
  },
  {
    id: "brazil",
    name: "Бразилия Серрадо",
    description:
      "Классический плотный вкус: орех и темный шоколад. Идеально под эспрессо и гейзерную кофеварку.",
    volume: "250 г",
    price: 26,
    currency: "BYN",
    image: img3,
    kind: "pack",
    ctaLabel: "Заказать",
    interestType: "one_time",
  },
  {
    id: "drip",
    name: "Дрип-пакеты, ассорти",
    description:
      "Ваш любимый кофе там, где нет кофемашины. Просто добавьте горячую воду. В коробке микс наших лучших сортов.",
    volume: "10 штук в упаковке",
    price: 18,
    currency: "BYN",
    image: img4,
    kind: "pack",
    ctaLabel: "Заказать",
    interestType: "one_time",
  },
  {
    id: "subscription",
    name: "Кофейная подписка",
    description:
      "Свежий кофе по умолчанию. Больше не нужно помнить о покупке пачки. Привезем 2 разные пачки по 250 г раз в месяц.",
    volume: "2 разные пачки по 250 г",
    price: 54,
    currency: "BYN",
    priceSuffix: "/ мес.",
    image: img5,
    kind: "subscription",
    badge: "Акция",
    bonus: "Доставка всегда бесплатная!",
    ctaLabel: "Оформить подписку",
    interestType: "subscription",
  },
];
