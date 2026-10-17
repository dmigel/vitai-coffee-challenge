# План проекта «Кварта»

Источник: [SPEC.md](./SPEC.md) (раздел «Заказ v2» приоритетный). Секции: Hero, Products, About, OrderForm, Contacts.

## Структура папок

```text
src/
  app/
    layout.tsx              # metadata, fonts, lang=ru
    page.tsx                # 5 секций + JSON-LD
    globals.css
    sitemap.ts
    robots.ts
    api/lead/route.ts
  components/
    sections/
      Hero.tsx
      Products.tsx
      About.tsx
      OrderForm.tsx
      Contacts.tsx
    HeroBackgroundVideo.tsx # "use client"
    ProductOrderButton.tsx  # "use client"
    LeadForm.tsx            # "use client"; Заказ v2
    UtmCapture.tsx          # "use client"
    YandexMap.tsx           # "use client"; iframe по клику
    JsonLd.tsx              # CoffeeShop schema
  data/
    products.ts
    contacts.ts
  lib/
    site.ts                 # title, description, getSiteUrl
    lead-schema.ts
    lead-schema.test.ts
    phone.ts
    phone-mask.ts
    utm.ts
    db.ts                   # server-only
    telegram.ts             # server-only
  assets/                   # logo, постер, 1–5.jpg, Anna, Dmitry
public/
  og.png                    # 1200×630
  favicon.png
  apple-touch-icon.png
  video/                    # bgMin.mp4
scripts/
  make-og.ts                # sharp → og / favicon / apple-touch
supabase/migrations/
  001_leads.sql
  002_leads.sql             # items jsonb + create_lead
docs/
  SPEC.md
  PLAN.md
  manual-tests.md
vitest.config.ts
```

## Компоненты и файлы

| Файл | Назначение |
|---|---|
| `src/app/layout.tsx` | `lang=ru`, next/font, Metadata API (OG/Twitter), `UtmCapture` |
| `src/app/page.tsx` | Сборка 5 секций, page metadata, `JsonLd` |
| `src/app/globals.css` | Токены, Hero / Products / About / форма / Contacts |
| `src/app/sitemap.ts` | `/sitemap.xml` |
| `src/app/robots.ts` | `/robots.txt` |
| `src/lib/site.ts` | `siteTitle`, `siteDescription`, `getSiteUrl` ← `NEXT_PUBLIC_SITE_URL` |
| `src/components/JsonLd.tsx` | JSON-LD CoffeeShop (адрес, часы; без телефона/рейтингов) |
| `src/components/sections/Hero.tsx` | `#hero`, единственный `h1` |
| `src/components/HeroBackgroundVideo.tsx` | Ленивое видео фона |
| `src/components/sections/Products.tsx` | `#products`, `h2` + карточки `h3` |
| `src/components/ProductOrderButton.tsx` | CTA → `#order` (prefill через URL) |
| `src/data/products.ts` | 5 карточек, тексты ТЗ |
| `src/components/sections/About.tsx` | `#about` |
| `src/components/sections/OrderForm.tsx` | `#order` + `LeadForm` |
| `src/components/LeadForm.tsx` | Заказ v2: состав, qty, UTM optional |
| `src/components/UtmCapture.tsx` | Захват UTM при загрузке |
| `src/lib/utm.ts` | `captureUtmFromLocation` / `readUtm` |
| `src/components/sections/Contacts.tsx` | `#contacts` |
| `src/components/YandexMap.tsx` | Заглушка → iframe по клику |
| `src/data/contacts.ts` | Адрес ул. Короля, 9; coords; заглушки контактов |
| `src/lib/phone.ts` / `phone-mask.ts` | BY-телефон → `+375XXXXXXXXX`, маска |
| `src/lib/lead-schema.ts` (+ test) | zod: items, лимиты по типу, UTM |
| `src/lib/db.ts` | `pg` + `DATABASE_URL`, пул max:1 |
| `src/lib/telegram.ts` | Уведомление с составом |
| `src/app/api/lead/route.ts` | `POST /api/lead` → `create_lead` |
| `scripts/make-og.ts` | OG 1200×630 + favicon + apple-touch из logo |
| `docs/manual-tests.md` | curl-чеклист API |

Server Components по умолчанию. `"use client"`: форма, UTM, видео, кнопка заказа, карта.

Контейнер секций: `max-w-[1280px]`. Иерархия: один `h1` (Hero) → `h2` секций → `h3` подблоков.

Env (имена в `.env.example`): `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SITE_URL`.

## Дизайн-токены

Цвета (CSS / Tailwind):

- `background` — `#f7f1e8`
- `foreground` — `#2c1b12`
- `surface` — `#fffaf3`
- `muted` — `#6b4f3a`
- `accent` — `#c47a3a`
- `accent-hover` — `#a8642c`
- `border` — `#e4d5c3`

Шрифты (`next/font`, кириллица, `display: swap`):

- `font-sans` — Manrope 400 (`--font-manrope`)
- `font-display` — Unbounded 500 (`--font-unbounded`)

Радиусы:

- `radius` / `rounded` — `1rem`
- `radius-lg` / `rounded-lg` — `1.5rem`

Дополнительно в UI: бейдж «Акция» — `#e11d48`; тень карточек Products — `0 2px 10px rgba(143, 149, 172, .2)`.

## Шаг 2 (сделано)

Каркас: токены, Unbounded + Manrope, 5 секций с `id`, `scroll-behavior: smooth` + `prefers-reduced-motion`.

Контент: Hero (LCP-постер, ленивое видео), Products, About — тексты ТЗ; prefill из карточек через URL.

Заявка (Заказ v2): `LeadForm` + `POST /api/lead` + `create_lead` (`items` jsonb); UTM optional; дедуп 10 мин; Vitest; `manual-tests.md`.

Contacts: самовывоз / доставка / связь (заглушки без ссылок); `YandexMap` — iframe только по клику.

SEO / OG: Metadata API (`metadataBase`, canonical, `ru_BY`, Twitter `summary_large_image`); `public/og.png` + favicon / apple-touch; JSON-LD CoffeeShop; `sitemap.ts`, `robots.ts`; иерархия `h1`–`h2`.

## Следующие шаги

1. Лёгкий CSS-motion (`transform` / `opacity`), уважение `prefers-reduced-motion`
2. Финальный lint / build и ручной прогон чеклиста (`manual-tests.md` + визуал)

## Риски скорости

| Риск | Снятие |
|---|---|
| Hero-видео (1.8–8 MB) | LCP = постер (`priority`); `<video>` после idle; `preload="metadata"`; не грузить при reduced-motion / saveData / 2g; мобилка `bgMin.mp4` |
| Яндекс.Карта | SSR/CSS-заглушка; iframe только по клику; фиксированная высота кадра |
| Шрифты | `next/font`, 2 начертания, subset с кириллицей |
| Клиентский JS | Минимум `"use client"`; анимации только CSS; blur не анимировать |
| Картинки | Только `next/image`; `priority` у одной LCP-картинки; остальные с `sizes` |
| Двойная заявка | Дедуп в SQL; honeypot `website`; `submittingRef` на клиенте |
| Serverless + Postgres pooler | Пул `pg` один на модуль, `max: 1`, без именованных prepared statements |
