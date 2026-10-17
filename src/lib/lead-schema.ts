import { z } from "zod";
import {
  BELARUS_PHONE_ERROR,
  normalizeBelarusPhone,
} from "@/lib/phone";

export {
  normalizeBelarusPhone,
  BELARUS_PHONE_CODES,
  BELARUS_PHONE_ERROR,
} from "@/lib/phone";

export const INTEREST_TYPES = ["one_time", "subscription", "question"] as const;
export type InterestType = (typeof INTEREST_TYPES)[number];

export const PRODUCTS = [
  "ethiopia",
  "colombia",
  "brazil",
  "drip",
  "subscription",
] as const;
export type Product = (typeof PRODUCTS)[number];

const INTEREST_LABELS: Record<InterestType, string> = {
  one_time: "Разовый заказ",
  subscription: "Подписка",
  question: "Вопрос",
};

const PRODUCT_LABELS: Record<Product, string> = {
  ethiopia: "Эфиопия",
  colombia: "Колумбия",
  brazil: "Бразилия",
  drip: "Дрип-пакеты",
  subscription: "Подписка",
};

export function interestTypeLabel(type: InterestType): string {
  return INTEREST_LABELS[type];
}

export function productLabel(product: Product | null): string {
  if (!product) return "не указан";
  return PRODUCT_LABELS[product];
}

/** Trim; пустая строка / отсутствие → null; иначе проверка длины. */
function optionalTrimmedNull(max: number, tooLongMessage: string) {
  return z.preprocess((val) => {
    if (val == null) return null;
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().max(max, tooLongMessage).nullable());
}

export const leadSchema = z
  .object({
    name: z
      .string({ error: "Укажите имя" })
      .trim()
      .min(2, "Имя должно быть не короче 2 символов")
      .max(60, "Имя должно быть не длиннее 60 символов"),
    interestType: z.enum(INTEREST_TYPES, {
      error: "Выберите тип обращения",
    }),
    product: z.preprocess((val) => {
      if (val === "" || val == null) return null;
      return val;
    }, z.enum(PRODUCTS).nullable()),
    phone: z
      .string({ error: "Укажите телефон" })
      .trim()
      .superRefine((value, ctx) => {
        if (!normalizeBelarusPhone(value)) {
          ctx.addIssue({
            code: "custom",
            message: BELARUS_PHONE_ERROR,
          });
        }
      })
      .transform((value) => normalizeBelarusPhone(value)!),
    comment: optionalTrimmedNull(500, "Комментарий не длиннее 500 символов"),
    utm_source: optionalTrimmedNull(100, "Не больше 100 символов"),
    utm_campaign: optionalTrimmedNull(100, "Не больше 100 символов"),
    landing_url: optionalTrimmedNull(500, "Не больше 500 символов"),
    /** Honeypot: если заполнено — бот; обрабатывается в route до сохранения. */
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { interestType, product } = data;

    if (interestType === "one_time") {
      if (!product) {
        ctx.addIssue({
          code: "custom",
          path: ["product"],
          message: "Выберите продукт для разового заказа",
        });
      } else if (product === "subscription") {
        ctx.addIssue({
          code: "custom",
          path: ["product"],
          message:
            "Для разового заказа выберите кофе или дрип-пакеты, не подписку",
        });
      }
    }

    if (interestType === "subscription" && product !== "subscription") {
      ctx.addIssue({
        code: "custom",
        path: ["product"],
        message: "Для подписки продукт должен быть «Подписка»",
      });
    }
  });

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;

/** Преобразует ошибки zod в { поле: "текст" } для ответа API. */
export function zodErrorsToFieldMap(
  error: z.ZodError,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in result)) {
      result[key] = issue.message;
    }
  }
  return result;
}
