-- Detalle de créditos y compras a cuotas.
--   Créditos: plazo en cuotas y mes de la primera, para mostrar "cuota 14 de 36".
--   Créditos y tarjetas: tasa fija o variable (con su referencia: IBR + 6, UVR + 7…) y si fue rediferido.
--   Tarjetas: compras diferidas a cuotas, cada una con su propio plazo.

alter table public.accounts
  add column term_months smallint check (term_months between 1 and 600),
  add column first_due_month text check (first_due_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  add column rate_type text check (rate_type in ('fixed', 'variable')),
  add column rate_reference text check (char_length(rate_reference) <= 60),
  add column refinanced boolean not null default false;

create table public.card_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  description text not null check (length(trim(description)) > 0 and char_length(description) <= 80),
  -- Valor de la compra (lo que se difirió).
  amount bigint not null check (amount > 0),
  installments smallint not null check (installments between 1 and 120),
  -- Mes de la primera cuota, 'YYYY-MM'.
  first_due_month text not null check (first_due_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  -- Lo que cobra el banco cada mes por esta compra, si se conoce.
  monthly_payment bigint check (monthly_payment > 0),
  annual_rate numeric(6, 3) check (annual_rate >= 0),
  rate_type text check (rate_type in ('fixed', 'variable')),
  refinanced boolean not null default false,
  created_at timestamptz not null default now()
);

create index card_purchases_account_idx on public.card_purchases (account_id);

alter table public.card_purchases enable row level security;

-- Solo sobre tarjetas propias.
create policy "card_purchases: solo el dueño" on public.card_purchases
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = (select auth.uid()) and a.kind = 'credit_card'
    )
  );

grant select, insert, update, delete on public.card_purchases to authenticated;
