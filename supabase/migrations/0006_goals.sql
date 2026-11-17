-- Fase 3: metas. Dos clases:
--   save   → juntar un monto antes de una fecha (un armario antes de febrero).
--   payoff → dejar una deuda en cero antes de una fecha.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('save', 'payoff')),
  name text not null check (length(trim(name)) > 0),
  emoji text check (char_length(emoji) <= 8),
  target_amount bigint check (target_amount > 0),
  target_date date not null,
  -- payoff: la deuda que se quiere saldar.
  account_id uuid references public.accounts (id) on delete cascade,
  -- payoff: saldo de la deuda al crear la meta, para medir el avance.
  start_balance bigint check (start_balance >= 0),
  created_on date not null default current_date,
  created_at timestamptz not null default now(),
  check ((kind = 'save' and target_amount is not null) or (kind = 'payoff' and account_id is not null))
);

-- Abonos a una meta de ahorro (negativos para retirar).
create table public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  amount bigint not null check (amount <> 0),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id);
create index goal_deposits_goal_idx on public.goal_deposits (goal_id);

alter table public.goals enable row level security;
alter table public.goal_deposits enable row level security;

create policy "goals: solo el dueño" on public.goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (account_id is null or exists (
      select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())
    ))
  );

create policy "goal_deposits: solo el dueño" on public.goal_deposits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.goals, public.goal_deposits to authenticated;
