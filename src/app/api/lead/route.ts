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
      "select * from public.create_lead($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        data.name,
        data.phone,
        data.interestType,
        data.product,
        data.comment,
        data.utm_source,
        data.utm_campaign,
        data.landing_url,
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
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "unknown";
    console.error("create_lead_failed", code);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  const shouldNotify = !isDuplicate || !tgSent;

  if (shouldNotify) {
    try {
      await sendLeadToTelegram({
        interestType: data.interestType,
        product: data.product,
        name: data.name,
        phone: data.phone,
        comment: data.comment,
        utm_source: data.utm_source,
        utm_campaign: data.utm_campaign,
        landing_url: data.landing_url,
      });

      try {
        await pool.query(
          "update public.leads set telegram_sent = true, telegram_error = null where id = $1",
          [leadId],
        );
      } catch (err) {
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code: unknown }).code)
            : "unknown";
        console.error("telegram_mark_sent_failed", leadId, code);
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
        const code =
          updateErr && typeof updateErr === "object" && "code" in updateErr
            ? String((updateErr as { code: unknown }).code)
            : "unknown";
        console.error("telegram_mark_error_failed", leadId, code);
      }
      // Заявка сохранена — клиенту всё равно 200
    }
  }

  return NextResponse.json({ ok: true, duplicate: isDuplicate });
}
