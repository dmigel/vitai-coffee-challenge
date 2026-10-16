# Принятые решения (приоритет над текстом ТЗ ниже)

- Адрес: Минск, ул. Короля, 9.
- Форма, порядок полей: Имя → Тип обращения → Продукт → Телефон → Комментарий.
- Тип обращения (interest_type): "one_time" (Разовый заказ), "subscription" (Подписка), "question" (Вопрос).
- Продукт (product): "ethiopia", "colombia", "brazil", "drip", "subscription".
  Правила: one_time — продукт обязателен и не "subscription"; subscription — продукт всегда "subscription"
  (поле на клиенте блокируется); question — продукт необязателен.
- Телефон: белорусский, мобильный и городской. Хранится как +375XXXXXXXXX (12 символов).
  Допустимые коды после 375: мобильные 25, 29, 33, 44; городские 15, 16, 17, 21, 22, 23. Далее 7 цифр.
  Принимать ввод: +375…, 375…, 80XX… (8 0 29 …), с пробелами, скобками, дефисами. Список кодов — одна константа.
- Дубли: тот же номер в течение 10 минут (независимо от товара) — новая заявка не создаётся,
  человеку показываем «Заявка уже принята». Это успех, а не ошибка.
- Источник рекламы: только utm_source и utm_campaign, плюс страница входа (landing_url).
- Хранилище: Supabase (PostgreSQL). Подключение из серверного кода через пакет pg по DATABASE_URL. Заявка создаётся вызовом SQL-функции public.create_lead (supabase/migrations/001_leads.sql): select * from public.create_lead($1..$8).
- Контакты (телефон/Telegram/Instagram) — статичная вёрстка без ссылок. Реальных значений пока нет, ставить заметные заглушки.
- Фото: /src/assets/Anna.jpg, /src/assets/Dmitry.jpg, /src/assets/1.jpg, /src/assets/2.jpg, /src/assets/3.jpg, /src/assets/4.jpg, /src/assets/5.jpg. 
- Видео: /public/video/bgMin.mp4, постер: /src/assets/bgposter.jpg. Для десктопной версии используй /public/video/bg.mp4. 
- Логотип: @/assets/logo.png.