import "server-only";
import type { InterestType, Product } from "@/lib/lead-schema";
import { interestTypeLabel, productLabel } from "@/lib/lead-schema";

export type TelegramLead = {
  interestType: InterestType;
  product: Product | null;
  name: string;
  phone: string;
  comment: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  landing_url: string | null;
};

/** Экранирование для Telegram HTML parse_mode. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sourceLine(
  utm_source: string | null,
  utm_campaign: string | null,
): string {
  if (utm_source || utm_campaign) {
    return `${utm_source ?? "—"} / ${utm_campaign ?? "—"}`;
  }
  return "не указан";
}

export function formatLeadMessage(lead: TelegramLead): string {
  const lines = [
    "<b>Новая заявка</b>",
    `Тип: ${escapeHtml(interestTypeLabel(lead.interestType))}`,
    `Продукт: ${escapeHtml(productLabel(lead.product))}`,
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
    `Комментарий: ${escapeHtml(lead.comment ?? "—")}`,
    `Источник: ${escapeHtml(sourceLine(lead.utm_source, lead.utm_campaign))}`,
    `Страница входа: ${escapeHtml(lead.landing_url ?? "—")}`,
  ];
  return lines.join("\n");
}

/**
 * Отправляет заявку в Telegram. Таймаут 5 с.
 * При ошибке бросает Error без токена в тексте.
 */
export async function sendLeadToTelegram(lead: TelegramLead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("telegram_config_missing");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLeadMessage(lead),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Не включаем тело ответа целиком — там может быть чувствительное
      throw new Error(`telegram_http_${res.status}`);
    }

    const data = (await res.json()) as { ok?: boolean };
    if (!data.ok) {
      throw new Error("telegram_api_not_ok");
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("telegram_timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
