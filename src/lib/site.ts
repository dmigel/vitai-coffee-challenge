/**
 * SEO / OG: базовый URL и тексты под запрос
 * «свежеобжаренный кофе Минск, подписка, доставка».
 */

export const siteName = "Кварта";

export const siteTitle =
  "Свежеобжаренный кофе в Минске — подписка и доставка | Кварта";

export const siteDescription =
  "Свежеобжаренный кофе в Минске: подписка с доставкой или разовый заказ. Мастерская «Кварта» обжаривает спешелти-зерно партиями по 5 кг и привозит на 1–3 день после обжарки.";

export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return new URL("http://localhost:3000");
  }
  return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
}
