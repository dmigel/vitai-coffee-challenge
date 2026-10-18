# Кварта

Лендинг мастерской обжарки кофе «Кварта» (Минск, ул. Короля, 9). Цель — заявка на разовый заказ, подписку или вопрос. Аудитория 25–45 лет, в основном с телефона; трафик из Instagram и Яндекса.

Полное ТЗ и принятые решения: [docs/SPEC.md](docs/SPEC.md). План и структура: [docs/PLAN.md](docs/PLAN.md).

## Стек

- **Next.js 15** (App Router, `src/`), **React 19**, **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL) через `pg` и `DATABASE_URL` (Transaction pooler)
- **Zod** — одна схема заявки для клиента и сервера
- **Vitest** — тесты схемы телефона и состава заказа

## Что делает сайт

Пять секций: Hero → Products → About → OrderForm → Contacts.

- Заявка: `POST /api/lead` → SQL-функция `create_lead` → уведомление в Telegram
- Типы обращения: разовый заказ, подписка (ровно 2 пачки), вопрос (без состава)
- Белорусский телефон → `+375XXXXXXXXX`; дедуп одного номера за 10 минут (ответ — успех, не ошибка)
- UTM (`utm_source`, `utm_campaign`) и `landing_url` — необязательны
- SEO: Metadata API, Open Graph, JSON-LD CoffeeShop, `sitemap.xml`, `robots.txt`

## Быстрый старт

Требования: Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local
```

Заполните `.env.local` (имена переменных — в `.env.example`):

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Connection string Postgres (Supabase pooler, порт 6543) |
| `TELEGRAM_BOT_TOKEN` | Бот для уведомлений о заявках |
| `TELEGRAM_CHAT_ID` | Чат / канал для уведомлений |
| `NEXT_PUBLIC_SITE_URL` | Канонический URL сайта (для OG и sitemap) |

Миграции: `supabase/migrations/` (`001_leads.sql`, `002_items.sql` — таблица `leads` и `create_lead`).

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер (Turbopack) |
| `npm run build` | Production-сборка |
| `npm start` | Запуск собранного приложения |
| `npm run lint` | ESLint |
| `npm test` | Vitest (схема заявки) |
| `npm run make-og` | OG 1200×630, favicon и apple-touch из логотипа |

Ручной чеклист API: [docs/manual-tests.md](docs/manual-tests.md).

## Структура

```text
src/
  app/           # layout, page, API /api/lead, sitemap, robots
  components/    # секции + клиентские виджеты (форма, UTM, видео, карта)
  data/          # products, contacts
  lib/           # схема заявки, телефон, db, telegram, site
  assets/        # фото, логотип, постер видео
public/          # og.png, favicon, video/bgMin.mp4
supabase/migrations/
docs/            # SPEC, PLAN, manual-tests
```

Server Components по умолчанию. `"use client"` только у формы, захвата UTM, фонового видео, кнопки заказа и карты.

## Заявка (кратко)

Тело `POST /api/lead`:

```json
{
  "name": "…",
  "interestType": "one_time" | "subscription" | "question",
  "items": [{ "product": "ethiopia" | "colombia" | "brazil" | "drip", "qty": 1 }],
  "phone": "+375…",
  "comment": "…",
  "utmSource": "…",
  "utmCampaign": "…",
  "landingUrl": "…",
  "website": ""
}
```

- `one_time`: 1–4 разных позиции, qty 1–10
- `subscription`: только ethiopia / colombia / brazil, сумма qty = 2
- `question`: `items: []`
- honeypot `website` — должен быть пустым

Ответы: `200 { ok: true, duplicate }`, `400 { ok: false, errors }`, `500 { ok: false, error: "server" }`.

## Безопасность

- Секреты (`DATABASE_URL`, Telegram) — только в серверном коде (`server-only`), не в `NEXT_PUBLIC_*`
- Не коммитьте `.env.local`
- В логах — id заявки и коды ошибок, без телефона, имени и комментария
