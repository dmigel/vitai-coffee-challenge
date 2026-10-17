/**
 * SEO / OG: базовый URL и тексты под запрос
 * «свежеобжаренный кофе Минск, подписка, доставка».
 */

export const siteName = "Кварта";

export const siteTitle =
  "Свежеобжаренный кофе в Минске — подписка и доставка | Кварта";

export const siteDescription =
  "Свежеобжаренный кофе в Минске: подписка с доставкой или разовый заказ. Мастерская «Кварта» обжаривает спешелти-зерно партиями по 5 кг и привозит на 1–3 день после обжарки.";

/** Превью из логотипа: public/og.png (1200×630), скрипт scripts/make-og.ts */
export const ogImagePath = "/og.png";

export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  }
  // Превью на Vercel без явного SITE_URL — иначе og:image уйдёт на localhost
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return new URL(`https://${vercel.replace(/^https?:\/\//, "")}`);
  }
  return new URL("http://localhost:3000");
}

/** Абсолютный URL OG-картинки — мессенджеры не принимают относительные пути */
export function getOgImageUrl(): string {
  return new URL(ogImagePath, getSiteUrl()).href;
}
