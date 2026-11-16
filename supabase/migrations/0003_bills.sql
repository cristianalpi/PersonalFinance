-- Fase 2: gastos fijos (recibos, suscripciones, arriendo) con día de pago.
-- Un recibo queda "pagado este mes" cuando existe un movimiento del mes que lo referencia.

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount bigint check (amount > 0), -- null: el valor cambia cada mes (servicios)
  due_day smallint not null check (due_day between 1 and 31),
  category text,
  created_at timestamptz not null default now()
);
create index bills_user_idx on public.bills (user_id);

alter table public.transactions add column bill_id uuid references public.bills (id) on delete set null;
create index transactions_bill_idx on public.transactions (bill_id) where bill_id is not null;

alter table public.bills enable row level security;
create policy "bills: solo el dueño" on public.bills
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.bills to authenticated;

-- Un movimiento solo puede referenciar un recibo propio (las FK no pasan por RLS).
create policy "transactions: recibo propio" on public.transactions
  as restrictive for all to authenticated
  using (true)
  with check (
    bill_id is null
    or exists (select 1 from public.bills b where b.id = bill_id and b.user_id = (select auth.uid()))
  );

-- El calendario ahora incluye los recibos, con kind = 'bill'.
create or replace function public.calendar_feed(p_token text)
returns table (id uuid, name text, kind text, due_day smallint, monthly_payment bigint)
language sql stable security definer set search_path = '' as $$
  with owner as (select public.token_owner(p_token, 'calendar') as uid)
  select a.id, a.name, a.kind, a.due_day, a.monthly_payment
  from public.accounts a, owner
  where a.user_id = owner.uid and a.kind in ('credit_card', 'loan') and a.due_day is not null
  union all
  select b.id, b.name, 'bill', b.due_day, b.amount
  from public.bills b, owner
  where b.user_id = owner.uid
  order by 4, 2;
$$;
