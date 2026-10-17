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

/** Товары в составе заказа (подписка — это interestType, не product). */
export const ORDER_PRODUCTS = [
  "ethiopia",
  "colombia",
  "brazil",
  "drip",
] as const;
export type OrderProduct = (typeof ORDER_PRODUCTS)[number];

/** Пачки для подписки (без дрипов). */
export const PACK_PRODUCTS = ["ethiopia", "colombia", "brazil"] as const;
export type PackProduct = (typeof PACK_PRODUCTS)[number];

export const QTY_MIN = 1;
export const QTY_MAX = 10;
export const ONE_TIME_MAX_ITEMS = 4;
export const SUBSCRIPTION_TOTAL_QTY = 2;

/**
 * Список для текущей формы (включает «subscription» как карточку).
 * В items допускаются только ORDER_PRODUCTS.
 */
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

export function interestTypeLabel(type: InterestType): string {
  return INTEREST_LABELS[type];
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

const orderItemSchema = z.object({
  product: z.enum(ORDER_PRODUCTS, {
    error: "Выберите вид кофе",
  }),
  qty: z
    .number({ error: "Укажите количество" })
    .int("Количество должно быть целым числом")
    .min(QTY_MIN, `Количество от ${QTY_MIN} до ${QTY_MAX}`)
    .max(QTY_MAX, `Количество от ${QTY_MIN} до ${QTY_MAX}`),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

function hasDuplicateProducts(items: OrderItem[]): boolean {
  const seen = new Set<OrderProduct>();
  for (const item of items) {
    if (seen.has(item.product)) return true;
    seen.add(item.product);
  }
  return false;
}

function isPackProduct(product: OrderProduct): product is PackProduct {
  return (PACK_PRODUCTS as readonly string[]).includes(product);
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
    items: z.preprocess(
      (val) => (val === undefined ? [] : val),
      z.array(orderItemSchema),
    ),
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
    utmSource: optionalTrimmedNull(100, "Не больше 100 символов"),
    utmCampaign: optionalTrimmedNull(100, "Не больше 100 символов"),
    landingUrl: optionalTrimmedNull(500, "Не больше 500 символов"),
    /** Honeypot: если заполнено — бот; обрабатывается в route до сохранения. */
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { interestType, items } = data;

    if (hasDuplicateProducts(items)) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Каждый вид кофе можно указать только один раз",
      });
      return;
    }

    if (interestType === "one_time") {
      if (items.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Выберите хотя бы один вид кофе",
        });
      } else if (items.length > ONE_TIME_MAX_ITEMS) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: `Можно выбрать не больше ${ONE_TIME_MAX_ITEMS} позиций`,
        });
      }
      return;
    }

    if (interestType === "subscription") {
      const hasNonPack = items.some((item) => !isPackProduct(item.product));
      if (hasNonPack) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Для подписки можно выбрать только пачки кофе, без дрип-пакетов",
        });
        return;
      }

      const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
      if (totalQty !== SUBSCRIPTION_TOTAL_QTY) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: `Для подписки выберите 2 упаковки, сейчас выбрано ${totalQty}`,
        });
      }
      return;
    }

    if (interestType === "question" && items.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Для вопроса состав заказа не нужен",
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
