import { timingSafeEqual } from "crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { products } from "@/data/products";
import { pool } from "@/lib/db";
import {
  INTEREST_TYPES,
  type InterestType,
  interestTypeLabel,
} from "@/lib/lead-schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Заявки — Кварта",
  robots: {
    index: false,
    follow: false,
  },
};

const LEADS_LIMIT = 200;

type LeadRow = {
  id: string | number | bigint;
  created_at: Date;
  name: string;
  phone: string;
  interest_type: string;
  items: unknown;
  comment: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  landing_url: string | null;
  telegram_sent: boolean;
};

function tokensEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return "*****";
  return `${phone.slice(0, 4)}*****${phone.slice(-4)}`;
}

function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "*****";
  if (trimmed.length === 1) return "*";
  return `${trimmed[0]}*****`;
}

function formatMinskDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-BY", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

function productName(productId: string): string {
  return products.find((p) => p.id === productId)?.name ?? productId;
}

function formatItems(raw: unknown): string {
  if (!Array.isArray(raw)) return "—";
  const lines: string[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const product = (entry as { product?: unknown }).product;
    const qty = (entry as { qty?: unknown }).qty;
    if (typeof product !== "string" || typeof qty !== "number") continue;
    lines.push(`${productName(product)} × ${qty}`);
  }
  return lines.length === 0 ? "—" : lines.join("\n");
}

function formatInterestType(value: string): string {
  if ((INTEREST_TYPES as readonly string[]).includes(value)) {
    return interestTypeLabel(value as InterestType);
  }
  return value;
}

type PageProps = {
  searchParams: Promise<{ key?: string | string[]; full?: string | string[] }>;
};

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyParam = params.key;
  const key = Array.isArray(keyParam) ? keyParam[0] : keyParam;
  const expected = process.env.ADMIN_VIEW_TOKEN;

  if (!expected || !key || !tokensEqual(key, expected)) {
    notFound();
  }

  const fullParam = params.full;
  const fullRaw = Array.isArray(fullParam) ? fullParam[0] : fullParam;
  const showFull = fullRaw === "1";

  let leads: LeadRow[] = [];
  try {
    const result = await pool.query<LeadRow>(
      `select
         id,
         created_at,
         name,
         phone,
         interest_type,
         items,
         comment,
         utm_source,
         utm_campaign,
         landing_url,
         telegram_sent
       from public.leads
       order by created_at desc
       limit $1`,
      [LEADS_LIMIT],
    );
    leads = result.rows;
  } catch {
    console.error("admin_leads_query_failed");
    throw new Error("admin_leads_query_failed");
  }

  return (
    <main className="min-h-dvh bg-background px-3 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-xl font-medium sm:text-2xl">
            Заявки
          </h1>
          <p className="text-sm text-muted">
            Последние {LEADS_LIMIT}
            {showFull ? " · полные данные" : " · данные скрыты"}
          </p>
        </header>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60 text-muted">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Дата</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Имя</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  Телефон
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  Тип обращения
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  Состав
                </th>
                <th className="min-w-[10rem] px-3 py-2 font-medium">
                  Комментарий
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  utm_source
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  utm_campaign
                </th>
                <th className="min-w-[12rem] px-3 py-2 font-medium">
                  landing_url
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  telegram_sent
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-muted"
                  >
                    Заявок пока нет
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={String(lead.id)}
                    className="border-b border-border/80 align-top last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {formatMinskDate(new Date(lead.created_at))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {showFull ? lead.name : maskName(lead.name)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {showFull ? lead.phone : maskPhone(lead.phone)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatInterestType(lead.interest_type)}
                    </td>
                    <td className="whitespace-pre-line px-3 py-2">
                      {formatItems(lead.items)}
                    </td>
                    <td className="max-w-[16rem] break-words px-3 py-2">
                      {lead.comment?.trim() ? lead.comment : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {lead.utm_source ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {lead.utm_campaign ?? "—"}
                    </td>
                    <td className="max-w-[18rem] break-all px-3 py-2">
                      {lead.landing_url ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {lead.telegram_sent ? "да" : "нет"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
