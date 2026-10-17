# Ручные проверки приёма заявок

БД и `create_lead` уже развёрнуты. Дедупликацию через API нужно проверить вручную
(у CI/агента нет доступа к секретам). Подставьте свой origin вместо `http://localhost:3000`.

Переменные окружения (имена, значения в `.env.local`): `DATABASE_URL`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Перед проверками: `npm run dev`.

Тестовый номер: `+375291234567`.

## 1. Одиночная отправка

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "product": "ethiopia",
    "phone": "+375291234567",
    "comment": "ручной тест",
    "utm_source": "manual",
    "utm_campaign": "dedup",
    "landing_url": "http://localhost:3000/"
  }'
```

Ожидание: `{"ok":true,"duplicate":false}`; строка в `leads`; сообщение в Telegram.

## 2. Пять параллельных запросов с тем же номером

```bash
seq 1 5 | xargs -P 5 -I{} curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "product": "ethiopia",
    "phone": "+375291234567",
    "comment": "parallel {}",
    "utm_source": "manual",
    "utm_campaign": "dedup"
  }'
```

Ожидание: все ответы `200` с `ok:true`; ровно **одна** новая строка за окно 10 минут
(остальные — `duplicate:true`); в Telegram не должно быть пяти одинаковых уведомлений
(повтор только если у существующей заявки `telegram_sent = false`).

## 3. Другой товар с тем же номером (в течение 10 минут)

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "product": "colombia",
    "phone": "+375291234567",
    "comment": "другой товар"
  }'
```

Ожидание: `{"ok":true,"duplicate":true}` — дедуп по номеру, независимо от товара.

## 4. Невалидный номер

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Тест",
    "interestType": "one_time",
    "product": "ethiopia",
    "phone": "+79001234567"
  }'
```

Ожидание: `400` и
`{"ok":false,"errors":{"phone":"Проверьте номер: он должен быть белорусским, например +375 29 123-45-67"}}`.

## Очистка тестовых строк

В SQL Editor Supabase (или `psql` по `DATABASE_URL`):

```sql
delete from public.leads
where phone = '+375291234567';
```
