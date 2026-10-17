/**
 * Контакты и адрес мастерской.
 * Телефон / Telegram / Instagram — заметные заглушки без ссылок (заменить позже).
 */

export const workshopAddress = "Минск, ул. Короля, 9";

/** Широта, долгота — точка мастерской на карте */
export const workshopCoords = {
  lat: 53.902241,
  lon: 27.542023,
} as const;

export const contacts = {
  phone: "+375 (XX) XXX-XX-XX",
  telegram: "@kvarta_roastery",
  instagram: "@kvarta_roastery",
} as const;

export type ContactChannel = keyof typeof contacts;
