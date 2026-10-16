-- 1. Новые колонки
alter table public.leads
    add column if not exists interest_type text,
    add column if not exists product text,
    add column if not exists comment text,
    add column if not exists utm_campaign text,
    add column if not exists landing_url text,
    add column if not exists telegram_sent boolean not null default false,
    add column if not exists telegram_error text;

-- 2. Ограничения
alter table public.leads
    alter column name set not null,
alter column phone set not null,
  add constraint leads_phone_format check (phone ~ '^\+375\d{9}$'),
  add constraint leads_interest_type_check
    check (interest_type in ('subscription', 'one_time', 'question'));

-- 3. Индекс для проверки дублей
create index if not exists leads_phone_created_idx
    on public.leads (phone, created_at desc);

-- 4. Закрываем таблицу от публичного доступа (политик не создаём)
alter table public.leads enable row level security;

-- 5. Атомарное создание заявки с дедупликацией за 10 минут
create or replace function public.create_lead(
  p_name text, p_phone text, p_interest_type text, p_product text,
  p_comment text, p_utm_source text, p_utm_campaign text, p_landing_url text
)
returns table (lead_id bigint, is_duplicate boolean, tg_sent boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
v_id bigint;
  v_tg boolean;
begin
  perform pg_advisory_xact_lock(hashtext(p_phone));

select l.id, l.telegram_sent into v_id, v_tg
from public.leads l
where l.phone = p_phone and l.created_at > now() - interval '10 minutes'
order by l.created_at desc
    limit 1;

if v_id is not null then
    return query select v_id, true, v_tg;
return;
end if;

insert into public.leads
(name, phone, interest_type, product, comment, utm_source, utm_campaign, landing_url)
values
    (p_name, p_phone, p_interest_type, p_product, p_comment, p_utm_source, p_utm_campaign, p_landing_url)
    returning id into v_id;

return query select v_id, false, false;
end;
$$;

revoke all on function public.create_lead(text,text,text,text,text,text,text,text)
    from public, anon, authenticated;
grant execute on function public.create_lead(text,text,text,text,text,text,text,text)
  to service_role;