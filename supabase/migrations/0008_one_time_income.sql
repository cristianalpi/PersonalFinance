-- Ingresos de una sola vez: horas extra, un bono, una devolución. Llegan en un mes concreto y no se repiten.
alter table public.incomes
  add column once_month text check (once_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  add constraint incomes_once_or_months check (once_month is null or months is null);
