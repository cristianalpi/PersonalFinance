-- Plan de ahorro de una meta: cuánto se abona, qué día del mes y, si se quiere, de qué ingreso sale.
-- Con un plan, el abono aparece cada mes en Pagos y al marcarlo se registra en la meta.

alter table public.goals
  add column plan_amount bigint check (plan_amount > 0),
  add column plan_day smallint check (plan_day between 1 and 31),
  add column plan_income_id uuid references public.incomes (id) on delete set null,
  -- Un plan tiene monto y día, o no existe.
  add constraint goals_plan_complete check ((plan_amount is null) = (plan_day is null));

-- La meta solo puede apuntar a una deuda propia y a un ingreso propio.
drop policy "goals: solo el dueño" on public.goals;
create policy "goals: solo el dueño" on public.goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (account_id is null or exists (
      select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())
    ))
    and (plan_income_id is null or exists (
      select 1 from public.incomes i where i.id = plan_income_id and i.user_id = (select auth.uid())
    ))
  );

-- «Este mes no aplica» también para el abono de una meta.
alter table public.checklist_skips drop constraint checklist_skips_item_type_check;
alter table public.checklist_skips add constraint checklist_skips_item_type_check check (item_type in ('bill', 'debt', 'income', 'goal'));
