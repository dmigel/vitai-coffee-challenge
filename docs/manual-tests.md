# Ручные проверки приёма заявок

БД и `create_lead` уже развёрнуты. Дедупликацию через API нужно проверить вручную
(у CI/агента нет доступа к секретам). Подставьте свой origin вместо `http://localhost:3000`.

Переменные окружения (имена, значения в `.env.local`): `DATABASE_URL`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Перед проверками: `npm run dev`.

Тестовый номер: `+375291234567`.

## 1. Без UTM

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "items": [{"product": "ethiopia", "qty": 1}],
    "phone": "+375291234567",
    "comment": "ручной тест без UTM"
  }'
```

Ожидание: `{"ok":true,"duplicate":false}`; в Telegram «Источник: прямой заход».

## 2. С UTM

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "items": [{"product": "ethiopia", "qty": 1}],
    "phone": "+375291234568",
    "comment": "ручной тест с UTM",
    "utmSource": "manual",
    "utmCampaign": "dedup",
    "landingUrl": "http://localhost:3000/"
  }'
```

Ожидание: `{"ok":true,"duplicate":false}`; в Telegram источник `manual / dedup`.

## 3. Несколько позиций (разовый заказ)

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "items": [
      {"product": "ethiopia", "qty": 2},
      {"product": "colombia", "qty": 1},
      {"product": "drip", "qty": 3}
    ],
    "phone": "+375291234569",
    "comment": "несколько позиций"
  }'
```

Ожидание: `{"ok":true,"duplicate":false}`; в Telegram состав построчно
(«Эфиопия Иргачеффе × 2» и т.д.).

## 4. Подписка: 2 одинаковые упаковки

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "subscription",
    "items": [{"product": "brazil", "qty": 2}],
    "phone": "+375291234570",
    "comment": "подписка 2 одинаковых"
  }'
```

Ожидание: `{"ok":true,"duplicate":false}`.

## 5. Подписка: 3 упаковки → 400

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "subscription",
    "items": [
      {"product": "ethiopia", "qty": 1},
      {"product": "colombia", "qty": 1},
      {"product": "brazil", "qty": 1}
    ],
    "phone": "+375291234571"
  }'
```

Ожидание: `400` и ошибка вида
`{"ok":false,"errors":{"items":"Для подписки выберите 2 упаковки, сейчас выбрано 3"}}`.

## 6. Пять параллельных запросов с одним номером

```bash
seq 1 5 | xargs -P 5 -I{} curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "items": [{"product": "ethiopia", "qty": 1}],
    "phone": "+375291234567",
    "comment": "parallel {}"
  }'
```

Ожидание: все ответы `200` с `ok:true`; ровно **одна** новая строка за окно 10 минут
(остальные — `duplicate:true`); в Telegram не должно быть пяти одинаковых уведомлений
(повтор только если у существующей заявки `telegram_sent = false`).

## 7. Невалидный номер

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "items": [{"product": "ethiopia", "qty": 1}],
    "phone": "+79001234567"
  }'
```

Ожидание: `400` и
`{"ok":false,"errors":{"phone":"Проверьте номер: он должен быть белорусским, например +375 29 123-45-67"}}`.

## Очистка тестовых строк

В SQL Editor Supabase (или `psql` по `DATABASE_URL`):

```sql
delete from public.leads
where phone like '+37529123456%';
```
