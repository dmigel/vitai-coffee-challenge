# План проекта «Кварта»

Источник требований: [SPEC.md](./SPEC.md). Секции: Hero, Products, About, OrderForm, Contacts (галереи нет).

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
      OrderForm.tsx              # заглушка → позже "use client"
      Contacts.tsx              # заглушка
    HeroBackgroundVideo.tsx     # "use client"
    ProductOrderButton.tsx      # "use client"
    YandexMap.tsx               # позже, "use client"
    UtmCapture.tsx              # позже, "use client"
  data/
    products.ts
    contacts.ts                 # позже
  lib/
    lead-schema.ts
    lead-schema.test.ts
    phone.ts
    db.ts                       # server-only
    telegram.ts                 # server-only
  assets/
public/video/                   # bgMin.mp4, bg.mp4
supabase/migrations/
  001_leads.sql
docs/
  SPEC.md
  PLAN.md
  manual-tests.md
vitest.config.ts
```

## Компоненты и файлы

| Файл | Назначение | Статус |
|---|---|---|
| `src/app/layout.tsx` | `lang=ru`, next/font, оболочка | есть |
| `src/app/page.tsx` | Сборка 5 секций | есть |
| `src/app/globals.css` | Токены, scroll-behavior, стили Hero / Products / About | есть |
| `src/components/sections/Hero.tsx` | `#hero` — постер, лого, тексты, CTA | есть |
| `src/components/HeroBackgroundVideo.tsx` | Ленивое видео фона | есть |
| `src/components/sections/Products.tsx` | `#products` — сетка карточек | есть |
| `src/components/ProductOrderButton.tsx` | CTA → `#order` с предвыбором в URL | есть |
| `src/data/products.ts` | 5 товаров, тексты из ТЗ, протокол предвыбора | есть |
| `src/components/sections/About.tsx` | `#about` — фото, тексты, блоки секрет/график | есть |
| `src/components/sections/OrderForm.tsx` | `#order` | заглушка |
| `src/components/sections/Contacts.tsx` | `#contacts` | заглушка |
| `src/components/YandexMap.tsx` | Ленивая карта | позже |
| `src/components/UtmCapture.tsx` | `utm_source`, `utm_campaign`, `landing_url` | позже |
| `src/data/contacts.ts` | Заглушки телефон / Telegram / Instagram | позже |
| `src/lib/phone.ts` | Коды BY, `normalizeBelarusPhone` → `+375XXXXXXXXX` | есть |
| `src/lib/lead-schema.ts` | zod, клиент + сервер; honeypot `website` | есть |
| `src/lib/lead-schema.test.ts` | Vitest: телефон, product/interestType, utm | есть |
| `src/lib/db.ts` | `pg` + `DATABASE_URL`, пул max:1 | есть |
| `src/lib/telegram.ts` | `sendLeadToTelegram`, HTML + escape, таймаут 5 с | есть |
| `src/app/api/lead/route.ts` | `POST /api/lead` → `create_lead`, Telegram | есть |
| `docs/manual-tests.md` | curl / SQL для ручной проверки дедупа | есть |
| `eslint.config.mjs` | ESLint (next/core-web-vitals) | есть |
| `vitest.config.ts` | Vitest, alias `@` | есть |

Server Components по умолчанию. `"use client"` только: форма, UTM, видео, карта, кнопка заказа из Products.

Предвыбор Products → форма: search-параметры `interest_type` + `product`, hash `#order` (см. комментарий в `products.ts`). Форма пока не читает их.

Контейнер контента секций Products / About: `max-w-[1280px]`, по центру.

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

Секция Products: фон белый; карточки — `box-shadow: 0 2px 10px rgba(143, 149, 172, .2)`; у подписки дополнительно `border` accent; бейдж «Акция» — `#e11d48`.

Секция About: фон `background`; два фото 50/50, `gap: 2rem`, `aspect-ratio: 4/5`, lazy `next/image`; блоки «секрет» / «график» — текст + inline-SVG, без карточек и рамок.

## Шаг 2 (сделано)

- Токены в `globals.css`, mobile-first отступы в секциях
- Шрифты Unbounded + Manrope
- `layout.tsx` (`lang=ru`), `page.tsx` с пятью секциями (`id`: hero, products, about, order, contacts)
- Плавный скролл по якорям (`scroll-behavior: smooth`; при `prefers-reduced-motion` — `auto`)
- ESLint (`eslint-config-next`), скрипт `npm run lint`

Также уже сделано после шага 2:

- Hero (Слайд 1): тексты дословно, LCP-постер, ленивое видео, CTA → `#products`
- Products (Слайд 2): `products.ts`, карточки, предвыбор через URL → `#order`
- About (Слайд 3): фото Ани/Димы, тексты ТЗ, акценты секрет/график
- Приём заявок: `lead-schema` / `phone`, `db`, `telegram`, `POST /api/lead` (`create_lead`, дедуп 10 мин в SQL), Vitest (`npm test`), `docs/manual-tests.md`
- Зависимости: `zod`, `pg`, `@types/pg`, `server-only`, `vitest`

## Следующие шаги

1. OrderForm UI — поля, маска телефона, zod на клиенте; чтение предвыбора из URL; отправка на `/api/lead`
2. Contacts — самовывоз/доставка, заглушки в `contacts.ts`, ленивая Яндекс.Карта
3. UtmCapture — захват `utm_source`, `utm_campaign`, `landing_url`
4. SEO / Open Graph — метаданные задаются отдельно
5. Лёгкий CSS-motion, финальный lint/build

## Риски скорости

| Риск | Снятие |
|---|---|
| Hero-видео (1.8–8 MB) | LCP = постер (`priority`); `<video>` после idle; `preload="metadata"`; fade на `canplay`; не грузить при reduced-motion / saveData / 2g; мобилка `bgMin.mp4`, десктоп `bg.mp4` |
| Яндекс.Карта | SSR-заглушка; iframe по клику или появлении в viewport |
| Шрифты | `next/font`, 2 начертания, subset с кириллицей |
| Клиентский JS | Минимум `"use client"`; анимации только CSS (`transform`/`opacity`); blur не анимировать |
| Картинки | Только `next/image`; `priority` у одной LCP-картинки (постер); Products / About без `priority`, фиксированный контейнер / `sizes` |
| Двойная заявка | Дедуп в SQL (`create_lead` + advisory lock); honeypot `website` |
| Serverless + Postgres | Пул `pg` один на модуль, `max: 1`, короткий `idleTimeoutMillis` |
