-- Fase 1: cuentas y movimientos. Todos los montos son pesos colombianos enteros (COP).

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('savings', 'credit_card', 'loan')),
  name text not null check (length(trim(name)) > 0),
  institution text,
  -- Ahorros: saldo a favor. Tarjeta o crédito: lo que se debe. Siempre >= 0.
  opening_balance bigint not null default 0 check (opening_balance >= 0),
  opening_date date not null default current_date,
  credit_limit bigint check (credit_limit > 0),
  annual_rate numeric(6, 3) check (annual_rate >= 0), -- % efectivo anual
  monthly_payment bigint check (monthly_payment > 0),
  statement_day smallint check (statement_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Cuenta afectada. En un pago es la deuda que se abona.
  account_id uuid not null references public.accounts (id) on delete cascade,
  -- Solo en pagos: cuenta de ahorros de la que sale el dinero (opcional).
  source_account_id uuid references public.accounts (id) on delete set null,
  kind text not null check (kind in ('income', 'expense', 'payment')),
  amount bigint not null check (amount > 0),
  category text,
  description text,
  occurred_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'wallet')),
  created_at timestamptz not null default now(),
  check (source_account_id is null or kind = 'payment'),
  check (source_account_id is distinct from account_id)
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_account_idx on public.transactions (account_id);
create index accounts_user_idx on public.accounts (user_id);

alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

create policy "accounts: solo el dueño" on public.accounts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Las llaves foráneas no pasan por RLS, así que se valida aquí que las cuentas
-- referenciadas también sean del usuario.
create policy "transactions: solo el dueño" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = (select auth.uid())
    )
    and (
      source_account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = source_account_id and a.user_id = (select auth.uid())
      )
    )
  );
