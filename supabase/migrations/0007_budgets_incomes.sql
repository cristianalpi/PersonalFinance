-- Fase 4: presupuestos por categoría, pagos omitidos un mes e ingresos programados.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (length(trim(category)) > 0),
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

-- «Este mes no aplica»: un pago fijo, una deuda (cuota rediferida) o un ingreso que no llega.
create table public.checklist_skips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('bill', 'debt', 'income')),
  item_id uuid not null,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id, month)
);

-- Ingresos que llegan en una fecha: salario cada mes, prima en junio y diciembre…
create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount bigint check (amount > 0), -- null: el valor cambia
  day smallint not null check (day between 1 and 31),
  -- Meses en que llega (1 a 12). Null: todos los meses.
  months smallint[] check (months is null or (cardinality(months) between 1 and 12 and months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[])),
  account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Un ingreso marcado como recibido es un movimiento que lo referencia.
alter table public.transactions add column income_id uuid references public.incomes (id) on delete set null;
create index transactions_income_idx on public.transactions (income_id) where income_id is not null;

alter table public.budgets enable row level security;
alter table public.checklist_skips enable row level security;
alter table public.incomes enable row level security;

create policy "budgets: solo el dueño" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "checklist_skips: solo el dueño" on public.checklist_skips
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "incomes: solo el dueño" on public.incomes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );

create policy "transactions: ingreso propio" on public.transactions
  as restrictive for all to authenticated
  using (true)
  with check (
    income_id is null
    or exists (select 1 from public.incomes i where i.id = income_id and i.user_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.budgets, public.checklist_skips, public.incomes to authenticated;
