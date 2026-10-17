/** Допустимые коды после 375: мобильные и городские (SPEC). */
export const BELARUS_PHONE_CODES = [
  "25",
  "29",
  "33",
  "44",
  "15",
  "16",
  "17",
  "21",
  "22",
  "23",
] as const;

export const BELARUS_PHONE_ERROR =
  "Проверьте номер: он должен быть белорусским, например +375 29 123-45-67";

const CODE_SET = new Set<string>(BELARUS_PHONE_CODES);

/**
 * Нормализует белорусский номер к виду +375XXXXXXXXX.
 * Принимает +375…, 375…, 80XX… с пробелами, скобками, дефисами.
 * При неверном номере возвращает null.
 */
export function normalizeBelarusPhone(input: string): string | null {
  const stripped = input.trim().replace(/[\s()\-]/g, "");
  if (!stripped) return null;

  let digits = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("80") && digits.length === 11) {
    digits = `375${digits.slice(2)}`;
  }

  if (!digits.startsWith("375") || digits.length !== 12) {
    return null;
  }

  const code = digits.slice(3, 5);
  const local = digits.slice(5);

  if (!CODE_SET.has(code) || !/^\d{7}$/.test(local)) {
    return null;
  }

  return `+${digits}`;
}
