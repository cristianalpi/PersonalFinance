-- Fase 2: efectivo como tipo de cuenta. Se comporta como una cuenta de ahorros:
-- es plata que tienes, recibe ingresos, se gasta y puede pagar deudas.

alter table public.accounts drop constraint accounts_kind_check;
alter table public.accounts
  add constraint accounts_kind_check check (kind in ('savings', 'cash', 'credit_card', 'loan'));
