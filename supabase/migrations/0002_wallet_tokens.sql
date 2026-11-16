-- Fase 2: lectura automática desde Apple Wallet (vía Atajos) y feed de calendario.
-- El iPhone y las apps de calendario no tienen sesión, así que entran con un token
-- personal. Solo se guarda su hash, y las funciones de abajo (security definer)
-- son la única puerta: validan el token y actúan únicamente sobre su dueño.

alter table public.accounts add column wallet_card_name text;
create unique index accounts_wallet_card_idx
  on public.accounts (user_id, lower(wallet_card_name))
  where wallet_card_name is not null;

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('wallet', 'calendar')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

-- Pagos de Wallet que no se pudieron registrar solos (tarjeta desconocida o
-- monto en cero): esperan a que el usuario los complete o los descarte.
create table public.wallet_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card text,
  merchant text,
  amount bigint,
  occurred_on date not null,
  received_at timestamptz not null default now()
);

alter table public.api_tokens enable row level security;
alter table public.wallet_inbox enable row level security;

create policy "api_tokens: solo el dueño" on public.api_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "wallet_inbox: solo el dueño" on public.wallet_inbox
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.token_owner(p_token text, p_kind text) returns uuid
language sql stable security definer set search_path = '' as $$
  select t.user_id from public.api_tokens t
  where t.kind = p_kind
    and t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;
revoke all on function public.token_owner(text, text) from public, anon, authenticated;

-- Devuelve {"status": "posted" | "review" | "duplicate"}, o null si el token no vale.
create function public.wallet_ingest(
  p_token text,
  p_card text,
  p_merchant text,
  p_amount bigint,
  p_occurred_on date default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := public.token_owner(p_token, 'wallet');
  v_card text := nullif(trim(p_card), '');
  v_merchant text := nullif(trim(p_merchant), '');
  v_day date := coalesce(p_occurred_on, (now() at time zone 'America/Bogota')::date);
  v_account uuid;
  v_category text;
begin
  if v_user is null then
    return null;
  end if;

  select a.id into v_account from public.accounts a
  where a.user_id = v_user and lower(a.wallet_card_name) = lower(v_card);

  if v_account is null or p_amount is null or p_amount <= 0 then
    insert into public.wallet_inbox (user_id, card, merchant, amount, occurred_on)
    values (v_user, v_card, v_merchant, nullif(greatest(coalesce(p_amount, 0), 0), 0), v_day);
    return jsonb_build_object('status', 'review');
  end if;

  -- Atajos a veces dispara dos veces el mismo pago.
  if exists (
    select 1 from public.transactions t
    where t.user_id = v_user and t.account_id = v_account and t.source = 'wallet'
      and t.amount = p_amount and t.description is not distinct from v_merchant
      and t.created_at > now() - interval '2 minutes'
  ) then
    return jsonb_build_object('status', 'duplicate');
  end if;

  -- Misma categoría que la última vez que se compró en ese comercio.
  select t.category into v_category from public.transactions t
  where t.user_id = v_user and t.category is not null and lower(t.description) = lower(v_merchant)
  order by t.occurred_on desc, t.created_at desc
  limit 1;

  insert into public.transactions (user_id, account_id, kind, amount, category, description, occurred_on, source)
  values (v_user, v_account, 'expense', p_amount, v_category, v_merchant, v_day, 'wallet');
  return jsonb_build_object('status', 'posted', 'category', v_category);
end;
$$;
revoke all on function public.wallet_ingest(text, text, text, bigint, date) from public;
grant execute on function public.wallet_ingest(text, text, text, bigint, date) to anon, authenticated;

-- Deudas con día de pago, para armar el calendario. Sin saldos: el feed queda en
-- servidores de calendario de terceros y no debe llevar más de lo necesario.
create function public.calendar_feed(p_token text)
returns table (id uuid, name text, kind text, due_day smallint, monthly_payment bigint)
language sql stable security definer set search_path = '' as $$
  select a.id, a.name, a.kind, a.due_day, a.monthly_payment
  from public.accounts a
  where a.user_id = public.token_owner(p_token, 'calendar')
    and a.kind in ('credit_card', 'loan') and a.due_day is not null
  order by a.due_day;
$$;
revoke all on function public.calendar_feed(text) from public;
grant execute on function public.calendar_feed(text) to anon, authenticated;

grant select, insert, update, delete on public.api_tokens, public.wallet_inbox to authenticated;
