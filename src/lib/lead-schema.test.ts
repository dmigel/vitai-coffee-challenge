import { describe, expect, it } from "vitest";
import {
  BELARUS_PHONE_ERROR,
  QTY_MAX,
  QTY_MIN,
  leadSchema,
  normalizeBelarusPhone,
} from "@/lib/lead-schema";

describe("normalizeBelarusPhone", () => {
  it("принимает мобильные в формате +375", () => {
    expect(normalizeBelarusPhone("+375291234567")).toBe("+375291234567");
    expect(normalizeBelarusPhone("+375 29 123-45-67")).toBe("+375291234567");
    expect(normalizeBelarusPhone("+375 (33) 123-45-67")).toBe("+375331234567");
    expect(normalizeBelarusPhone("+375 44 111 22 33")).toBe("+375441112233");
    expect(normalizeBelarusPhone("+375251234567")).toBe("+375251234567");
  });

  it("принимает мобильные без плюса (375…)", () => {
    expect(normalizeBelarusPhone("375291234567")).toBe("+375291234567");
    expect(normalizeBelarusPhone("375 29 123 45 67")).toBe("+375291234567");
  });

  it("принимает формат 80XX…", () => {
    expect(normalizeBelarusPhone("80291234567")).toBe("+375291234567");
    expect(normalizeBelarusPhone("8 029 123-45-67")).toBe("+375291234567");
    expect(normalizeBelarusPhone("8 (029) 123-45-67")).toBe("+375291234567");
    expect(normalizeBelarusPhone("80331234567")).toBe("+375331234567");
  });

  it("принимает городские коды", () => {
    expect(normalizeBelarusPhone("+375171234567")).toBe("+375171234567");
    expect(normalizeBelarusPhone("+375 17 123-45-67")).toBe("+375171234567");
    expect(normalizeBelarusPhone("80171234567")).toBe("+375171234567");
    expect(normalizeBelarusPhone("+375152123456")).toBe("+375152123456");
    expect(normalizeBelarusPhone("+375162123456")).toBe("+375162123456");
    expect(normalizeBelarusPhone("+375212123456")).toBe("+375212123456");
    expect(normalizeBelarusPhone("+375222123456")).toBe("+375222123456");
    expect(normalizeBelarusPhone("+375232123456")).toBe("+375232123456");
  });

  it("отклоняет мусор и чужие коды", () => {
    expect(normalizeBelarusPhone("")).toBeNull();
    expect(normalizeBelarusPhone("abc")).toBeNull();
    expect(normalizeBelarusPhone("+37529123456")).toBeNull(); // коротко
    expect(normalizeBelarusPhone("+3752912345678")).toBeNull(); // длинно
    expect(normalizeBelarusPhone("+375001234567")).toBeNull(); // чужой код
    expect(normalizeBelarusPhone("+79001234567")).toBeNull(); // РФ
    expect(normalizeBelarusPhone("+12345678901")).toBeNull();
    expect(normalizeBelarusPhone("12345")).toBeNull();
    expect(normalizeBelarusPhone("+375 99 123-45-67")).toBeNull();
  });
});

describe("leadSchema phone", () => {
  const base = {
    name: "Анна",
    interestType: "one_time" as const,
    items: [{ product: "ethiopia" as const, qty: 1 }],
  };

  it("нормализует телефон при валидации", () => {
    const result = leadSchema.safeParse({
      ...base,
      phone: "8 (029) 123-45-67",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+375291234567");
    }
  });

  it("возвращает понятную ошибку для неверного номера", () => {
    const result = leadSchema.safeParse({
      ...base,
      phone: "+79001234567",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneIssue = result.error.issues.find((i) => i.path[0] === "phone");
      expect(phoneIssue?.message).toBe(BELARUS_PHONE_ERROR);
    }
  });
});

describe("leadSchema items / interestType", () => {
  const phone = "+375291234567";

  it("one_time: хотя бы одна позиция, без повторов, до 4 видов", () => {
    const empty = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [],
      phone,
    });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]?.message).toBe(
        "Выберите хотя бы один вид кофе",
      );
    }

    const dup = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [
        { product: "ethiopia", qty: 1 },
        { product: "ethiopia", qty: 2 },
      ],
      phone,
    });
    expect(dup.success).toBe(false);

    const fourOk = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [
        { product: "ethiopia", qty: 1 },
        { product: "colombia", qty: 1 },
        { product: "brazil", qty: 1 },
        { product: "drip", qty: 1 },
      ],
      phone,
    });
    expect(fourOk.success).toBe(true);

    const ok = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [
        { product: "ethiopia", qty: 2 },
        { product: "drip", qty: 1 },
      ],
      phone,
    });
    expect(ok.success).toBe(true);
  });

  it("граничные qty: 1 и 10 ок, 0 и 11 — ошибка", () => {
    const minOk = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [{ product: "brazil", qty: QTY_MIN }],
      phone,
    });
    expect(minOk.success).toBe(true);

    const maxOk = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [{ product: "brazil", qty: QTY_MAX }],
      phone,
    });
    expect(maxOk.success).toBe(true);

    const zero = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [{ product: "brazil", qty: 0 }],
      phone,
    });
    expect(zero.success).toBe(false);

    const eleven = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [{ product: "brazil", qty: 11 }],
      phone,
    });
    expect(eleven.success).toBe(false);

    const notInt = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      items: [{ product: "brazil", qty: 1.5 }],
      phone,
    });
    expect(notInt.success).toBe(false);
  });

  it("subscription: сумма qty ровно 2, только пачки", () => {
    const onePack = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      items: [{ product: "ethiopia", qty: 1 }],
      phone,
    });
    expect(onePack.success).toBe(false);
    if (!onePack.success) {
      expect(onePack.error.issues[0]?.message).toBe(
        "Для подписки выберите 2 упаковки, сейчас выбрано 1",
      );
    }

    const twoSame = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      items: [{ product: "ethiopia", qty: 2 }],
      phone,
    });
    expect(twoSame.success).toBe(true);

    const twoDifferent = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      items: [
        { product: "ethiopia", qty: 1 },
        { product: "colombia", qty: 1 },
      ],
      phone,
    });
    expect(twoDifferent.success).toBe(true);

    const three = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      items: [
        { product: "ethiopia", qty: 1 },
        { product: "colombia", qty: 1 },
        { product: "brazil", qty: 1 },
      ],
      phone,
    });
    expect(three.success).toBe(false);
    if (!three.success) {
      expect(three.error.issues[0]?.message).toBe(
        "Для подписки выберите 2 упаковки, сейчас выбрано 3",
      );
    }

    const withDrip = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      items: [
        { product: "ethiopia", qty: 1 },
        { product: "drip", qty: 1 },
      ],
      phone,
    });
    expect(withDrip.success).toBe(false);
  });

  it("question: items пустой; непустой — ошибка", () => {
    const ok = leadSchema.safeParse({
      name: "Дима",
      interestType: "question",
      phone,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.items).toEqual([]);
    }

    const withItems = leadSchema.safeParse({
      name: "Дима",
      interestType: "question",
      items: [{ product: "drip", qty: 1 }],
      phone,
    });
    expect(withItems.success).toBe(false);
  });
});

describe("leadSchema utm / comment trim", () => {
  const base = {
    name: "Анна",
    interestType: "question" as const,
    phone: "+375291234567",
  };

  it("заявка без UTM — валидна, поля null", () => {
    const result = leadSchema.safeParse({
      ...base,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.utmSource).toBeNull();
      expect(result.data.utmCampaign).toBeNull();
      expect(result.data.landingUrl).toBeNull();
      expect(result.data.items).toEqual([]);
    }
  });

  it("пустые utm и comment → null, trim пробелов", () => {
    const result = leadSchema.safeParse({
      ...base,
      comment: "   ",
      utmSource: "  instagram  ",
      utmCampaign: "",
      landingUrl: "  https://example.com/  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeNull();
      expect(result.data.utmSource).toBe("instagram");
      expect(result.data.utmCampaign).toBeNull();
      expect(result.data.landingUrl).toBe("https://example.com/");
    }
  });

  it("обрезает слишком длинные utm", () => {
    const long = "x".repeat(101);
    const result = leadSchema.safeParse({
      ...base,
      utmSource: long,
    });
    expect(result.success).toBe(false);
  });

  it("обрезает имя и ограничивает comment", () => {
    const shortName = leadSchema.safeParse({
      ...base,
      name: "А",
    });
    expect(shortName.success).toBe(false);

    const longComment = leadSchema.safeParse({
      ...base,
      name: "Анна",
      comment: "c".repeat(501),
    });
    expect(longComment.success).toBe(false);
  });
});
