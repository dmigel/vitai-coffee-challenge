-- 002_items.sql: заказ из нескольких позиций

-- 1. Старая функция (другая сигнатура) и старая колонка
drop function if exists public.create_lead(text,text,text,text,text,text,text,text);
alter table public.leads drop column if exists product;

-- 2. Состав заказа: [{"product":"ethiopia","qty":2}, ...]
alter table public.leads
    add column if not exists items jsonb not null default '[]'::jsonb;

alter table public.leads drop constraint if exists leads_items_check;
alter table public.leads
    add constraint leads_items_check
        check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 4);

-- 3. Новая функция с дедупликацией за 10 минут
create or replace function public.create_lead(
  p_name text, p_phone text, p_interest_type text, p_items jsonb,
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
(name, phone, interest_type, items, comment, utm_source, utm_campaign, landing_url)
values
    (p_name, p_phone, p_interest_type, coalesce(p_items, '[]'::jsonb),
     p_comment, p_utm_source, p_utm_campaign, p_landing_url)
    returning id into v_id;

return query select v_id, false, false;
end;
$$;

revoke all on function public.create_lead(text,text,text,jsonb,text,text,text,text)
    from public, anon, authenticated;
grant execute on function public.create_lead(text,text,text,jsonb,text,text,text,text)
  to service_role;