# План проекта «Кварта»

Источник: [SPEC.md](./SPEC.md) (раздел «Заказ v2» приоритетный). Секции: Hero, Products, About, OrderForm, Contacts.

## Структура папок

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    api/lead/route.ts
  components/
    sections/
      Hero.tsx
      Products.tsx
      About.tsx
      OrderForm.tsx
      Contacts.tsx              # заглушка
    HeroBackgroundVideo.tsx     # "use client"
    ProductOrderButton.tsx      # "use client"
    LeadForm.tsx                # "use client"; Заказ v2 (items + qty)
    UtmCapture.tsx              # "use client"
    YandexMap.tsx               # позже
  data/
    products.ts                 # 5 карточек + канал prefill (URL)
    contacts.ts                 # позже
  lib/
    lead-schema.ts              # zod: items, UTM camelCase
    lead-schema.test.ts
    phone.ts
    phone-mask.ts
    utm.ts                      # localStorage + memory fallback
    db.ts                       # server-only, pg pool
    telegram.ts                 # server-only
  assets/                       # logo, постер, 1–5.jpg, Anna, Dmitry
public/video/                   # bgMin.mp4, bg.mp4
supabase/migrations/
  001_leads.sql
  002_leads.sql                 # items jsonb + create_lead(..., p_items jsonb, ...)
docs/
  SPEC.md
  PLAN.md
  manual-tests.md
vitest.config.ts
```

## Компоненты и файлы

| Файл | Назначение | Статус |
|---|---|---|
| `src/app/layout.tsx` | `lang=ru`, next/font, `UtmCapture` | есть |
| `src/app/page.tsx` | Сборка 5 секций | есть |
| `src/app/globals.css` | Токены, Hero / Products / About / форма / степперы | есть |
| `src/components/sections/Hero.tsx` | `#hero` | есть |
| `src/components/HeroBackgroundVideo.tsx` | Ленивое видео фона | есть |
| `src/components/sections/Products.tsx` | `#products` | есть |
| `src/components/ProductOrderButton.tsx` | CTA → `#order` (`interest_type` + `product` в URL) | есть |
| `src/data/products.ts` | 5 карточек, тексты ТЗ, контракт prefill | есть |
| `src/components/sections/About.tsx` | `#about` | есть |
| `src/components/sections/OrderForm.tsx` | `#order` + `LeadForm`, блок по центру | есть |
| `src/components/LeadForm.tsx` | Заказ v2: состав, qty, UTM optional | есть |
| `src/components/UtmCapture.tsx` | Захват UTM при загрузке | есть |
| `src/lib/utm.ts` | `captureUtmFromLocation` / `readUtm` | есть |
| `src/components/sections/Contacts.tsx` | `#contacts` | заглушка |
| `src/components/YandexMap.tsx` | Ленивая карта | позже |
| `src/data/contacts.ts` | Заглушки телефон / Telegram / Instagram | позже |
| `src/lib/phone.ts` | Коды BY, нормализация → `+375XXXXXXXXX` | есть |
| `src/lib/phone-mask.ts` | Маска ввода телефона | есть |
| `src/lib/lead-schema.ts` | zod: `items`, лимиты по типу, UTM optional | есть |
| `src/lib/lead-schema.test.ts` | Vitest: телефон, items × 3 типа, qty, UTM | есть |
| `src/lib/db.ts` | `pg` + `DATABASE_URL`, пул max:1 | есть |
| `src/lib/telegram.ts` | Состав построчно, «прямой заход» без UTM | есть |
| `src/app/api/lead/route.ts` | `POST /api/lead` → `create_lead(..., $4::jsonb, ...)` | есть |
| `docs/manual-tests.md` | curl: UTM / items / подписка / дедуп | есть |

Server Components по умолчанию. `"use client"`: форма, UTM, видео, кнопка заказа; позже — карта.

Контейнер Products / About / Order: `max-w-[1280px]`. Order: заголовок и форма по центру страницы.

Env (имена в `.env.example`): `DATABASE_URL` (Transaction pooler, 6543), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SITE_URL`.

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

Products: фон белый; карточки — `box-shadow: 0 2px 10px rgba(143, 149, 172, .2)`; подписка — `border` accent; бейдж «Акция» — `#e11d48`.

About: фон `background`; фото 50/50, `gap: 2rem`, `aspect-ratio: 4/5`, lazy `next/image`; блоки «секрет» / «график» без карточек.

## Шаг 2 (сделано)

Каркас и база:

- Токены в `globals.css`, mobile-first отступы
- Шрифты Unbounded + Manrope
- `layout.tsx` (`lang=ru`), `page.tsx` с пятью секциями (`id`: hero, products, about, order, contacts)
- `scroll-behavior: smooth` (при `prefers-reduced-motion` — `auto`)
- ESLint (`eslint-config-next`), `npm run lint`

Контент и заявка:

- Hero, Products, About — тексты ТЗ, LCP-постер, ленивое видео, предвыбор через URL
- UtmCapture + `utm.ts` (UTM необязательны)
- OrderForm + LeadForm по Заказ v2:
  - порядок: имя → тип → состав → телефон → комментарий
  - состав: fieldset, степперы qty 0–10; one_time 4 позиции; subscription 3 пачки, сумма qty = 2; question → `items: []`
  - выбор qty хранится отдельно по типу обращения
  - ориентировочная сумма и подсказка доставки (клиентская)
  - prefill из карточек: «Заказать» → one_time + qty 1; «Оформить подписку» → subscription; фокус на первом пустом поле
  - payload: `{ name, interestType, items, phone, comment, utmSource?, utmCampaign?, landingUrl?, website }`
  - дедуп-текст из SPEC, защита от двойной отправки, маска телефона, таймаут 15 с
- API: `items` jsonb, `create_lead` из `002_leads.sql`, Telegram с составом
- Vitest, `manual-tests.md`
- Зависимости: `zod`, `pg`, `@types/pg`, `server-only`, `vitest`

## Следующие шаги

1. Contacts — самовывоз/доставка, `contacts.ts`, ленивая Яндекс.Карта
2. SEO / Open Graph (логотип `src/assets/logo.png`)
3. Лёгкий CSS-motion (transform/opacity), финальный lint/build и ручной прогон чеклиста

## Риски скорости

| Риск | Снятие |
|---|---|
| Hero-видео (1.8–8 MB) | LCP = постер (`priority`); `<video>` после idle; `preload="metadata"`; fade на `canplay`; не грузить при reduced-motion / saveData / 2g; мобилка `bgMin.mp4`, десктоп `bg.mp4` |
| Яндекс.Карта | SSR-заглушка; iframe по клику или в viewport |
| Шрифты | `next/font`, 2 начертания, subset с кириллицей |
| Клиентский JS | Минимум `"use client"`; анимации только CSS (`transform`/`opacity`); blur не анимировать |
| Картинки | Только `next/image`; `priority` у одной LCP-картинки; Products / About без `priority`, `sizes` |
| Двойная заявка | Дедуп в SQL (`create_lead` + advisory lock); honeypot `website`; `submittingRef` на клиенте |
| Serverless + Postgres pooler | Пул `pg` один на модуль, `max: 1`, без именованных prepared statements, `ssl: { rejectUnauthorized: false }` |
