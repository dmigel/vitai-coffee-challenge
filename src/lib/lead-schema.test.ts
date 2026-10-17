import { describe, expect, it } from "vitest";
import {
  BELARUS_PHONE_ERROR,
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
    product: "ethiopia" as const,
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

describe("leadSchema product / interestType", () => {
  const phone = "+375291234567";

  it("one_time требует продукт и запрещает subscription", () => {
    const missing = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      phone,
    });
    expect(missing.success).toBe(false);

    const sub = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      product: "subscription",
      phone,
    });
    expect(sub.success).toBe(false);

    const ok = leadSchema.safeParse({
      name: "Дима",
      interestType: "one_time",
      product: "brazil",
      phone,
    });
    expect(ok.success).toBe(true);
  });

  it("subscription требует product = subscription", () => {
    const wrong = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      product: "ethiopia",
      phone,
    });
    expect(wrong.success).toBe(false);

    const ok = leadSchema.safeParse({
      name: "Дима",
      interestType: "subscription",
      product: "subscription",
      phone,
    });
    expect(ok.success).toBe(true);
  });

  it("question допускает отсутствие продукта", () => {
    const ok = leadSchema.safeParse({
      name: "Дима",
      interestType: "question",
      phone,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.product).toBeNull();
    }

    const withProduct = leadSchema.safeParse({
      name: "Дима",
      interestType: "question",
      product: "drip",
      phone,
    });
    expect(withProduct.success).toBe(true);
  });
});

describe("leadSchema utm / comment trim", () => {
  const base = {
    name: "Анна",
    interestType: "question" as const,
    phone: "+375291234567",
  };

  it("пустые utm и comment → null, trim пробелов", () => {
    const result = leadSchema.safeParse({
      ...base,
      comment: "   ",
      utm_source: "  instagram  ",
      utm_campaign: "",
      landing_url: "  https://example.com/  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeNull();
      expect(result.data.utm_source).toBe("instagram");
      expect(result.data.utm_campaign).toBeNull();
      expect(result.data.landing_url).toBe("https://example.com/");
    }
  });

  it("обрезает слишком длинные utm", () => {
    const long = "x".repeat(101);
    const result = leadSchema.safeParse({
      ...base,
      utm_source: long,
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
