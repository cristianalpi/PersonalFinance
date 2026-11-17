-- Apariencia de cada cuenta (color, imagen del banco, últimos 4 dígitos) y
-- monto original de los créditos, para medir cuánto falta por pagar.

alter table public.accounts
  add column color text check (color ~ '^#[0-9a-fA-F]{6}$'),
  add column last4 text check (last4 ~ '^[0-9]{4}$'),
  -- Imagen pequeña que sube el usuario, guardada como data URL (máx. ~110 KB).
  add column logo text check (logo ~ '^data:image/(png|jpeg|webp);base64,' and length(logo) <= 150000),
  add column original_amount bigint check (original_amount > 0);
