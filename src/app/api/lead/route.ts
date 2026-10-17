import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { leadSchema, zodErrorsToFieldMap } from "@/lib/lead-schema";
import { sendLeadToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";

type CreateLeadRow = {
  lead_id: string | number | bigint;
  is_duplicate: boolean;
  tg_sent: boolean;
};

function dbErrorFields(err: unknown): {
  code: string | undefined;
  constraint: string | undefined;
  message: string | undefined;
} {
  if (!err || typeof err !== "object") {
    return { code: undefined, constraint: undefined, message: undefined };
  }
  const e = err as {
    code?: unknown;
    constraint?: unknown;
    message?: unknown;
  };
  return {
    code: e.code != null ? String(e.code) : undefined,
    constraint: e.constraint != null ? String(e.constraint) : undefined,
    message: e.message != null ? String(e.message) : undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: "Некорректный JSON. Обновите страницу и попробуйте снова." } },
      { status: 400 },
    );
  }

  if (body === null || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, errors: { _form: "Некорректные данные формы." } },
      { status: 400 },
    );
  }

  const raw = body as Record<string, unknown>;

  // Honeypot: заполненное скрытое поле — бот; отвечаем успехом без сохранения
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json({ ok: true, duplicate: false });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: zodErrorsToFieldMap(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  let leadId: string | number | bigint;
  let isDuplicate: boolean;
  let tgSent: boolean;

  try {
    const result = await pool.query<CreateLeadRow>(
      "select * from public.create_lead($1,$2,$3,$4::jsonb,$5,$6,$7,$8)",
      [
        data.name,
        data.phone,
        data.interestType,
        JSON.stringify(data.items),
        data.comment,
        data.utmSource,
        data.utmCampaign,
        data.landingUrl,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      console.error("create_lead_empty_result");
      return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
    }

    leadId = row.lead_id;
    isDuplicate = row.is_duplicate;
    tgSent = row.tg_sent;
  } catch (err) {
    const { code, constraint, message } = dbErrorFields(err);
    console.error("create_lead_failed", { code, constraint, message });
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  const shouldNotify = !isDuplicate || !tgSent;

  if (shouldNotify) {
    try {
      await sendLeadToTelegram({
        interestType: data.interestType,
        items: data.items,
        name: data.name,
        phone: data.phone,
        comment: data.comment,
        utmSource: data.utmSource,
        utmCampaign: data.utmCampaign,
        landingUrl: data.landingUrl,
      });

      try {
        await pool.query(
          "update public.leads set telegram_sent = true, telegram_error = null where id = $1",
          [leadId],
        );
      } catch (err) {
        const { code, constraint, message } = dbErrorFields(err);
        console.error("telegram_mark_sent_failed", leadId, {
          code,
          constraint,
          message,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message.slice(0, 200) : "telegram_error";
      // Без токена и без персональных данных
      console.error("telegram_send_failed", leadId, message);

      try {
        await pool.query(
          "update public.leads set telegram_sent = false, telegram_error = $2 where id = $1",
          [leadId, message],
        );
      } catch (updateErr) {
        const { code, constraint, message: dbMessage } =
          dbErrorFields(updateErr);
        console.error("telegram_mark_error_failed", leadId, {
          code,
          constraint,
          message: dbMessage,
        });
      }
      // Заявка сохранена — клиенту всё равно 200
    }
  }

  return NextResponse.json({ ok: true, duplicate: isDuplicate });
}
