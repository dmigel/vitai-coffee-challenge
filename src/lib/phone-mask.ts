/**
 * Маска белорусского телефона: +375 (XX) XXX-XX-XX.
 * Поддерживает вставку «8029…», «375…», «+375…».
 */
export function formatBelarusPhoneMask(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("80")) {
    digits = `375${digits.slice(2)}`;
  }

  if (digits.startsWith("375")) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 9);

  if (digits.length === 0) {
    return "+375";
  }

  let result = `+375 (${digits.slice(0, 2)}`;

  if (digits.length <= 2) {
    return result;
  }

  result += `) ${digits.slice(2, 5)}`;

  if (digits.length <= 5) {
    return result;
  }

  result += `-${digits.slice(5, 7)}`;

  if (digits.length <= 7) {
    return result;
  }

  result += `-${digits.slice(7, 9)}`;
  return result;
}
