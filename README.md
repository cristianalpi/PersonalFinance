# Finanzas

Plataforma personal para llevar cuentas de ahorros, tarjetas de crédito y créditos, y ver cómo cambian los saldos con cada pago y cada gasto. Todo en pesos colombianos.

Stack: Next.js 16 (App Router) · Supabase (Postgres + Auth) · Tailwind 4 · Recharts.

## Puesta en marcha

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor ejecuta `supabase/migrations/0001_init.sql`.
3. Copia `.env.example` a `.env.local` y pon la URL y la clave *publishable* del proyecto.
4. `npm install && npm run dev`, abre http://localhost:3000 y usa **Crear cuenta**.
5. Como es de un solo usuario: después de crear tu cuenta, desactiva los registros nuevos en Supabase (Authentication → Sign In / Providers → *Allow new users to sign up*).

## Cómo se calculan los saldos

- Cada cuenta guarda un **saldo inicial** en una fecha. En ahorros es plata a favor; en tarjetas y créditos es lo que se debe.
- El saldo actual es el inicial más los movimientos (`src/lib/finance.ts`):
  - **Ingreso**: sube una cuenta de ahorros.
  - **Gasto**: baja una cuenta de ahorros o sube la deuda de una tarjeta.
  - **Pago**: baja la deuda de una tarjeta o crédito y, si indicas de qué cuenta sale, baja esa cuenta de ahorros.
- Los intereses no se calculan solos todavía: regístralos como gasto en la categoría «Intereses y cargos» cuando lleguen en el extracto.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Pruebas de la lógica de saldos |
| `npm run lint` | ESLint |

## Seguridad

Las tablas tienen Row Level Security: cada fila pertenece a `auth.uid()`. El repositorio solo contiene código; los datos viven en tu proyecto de Supabase y `.env.local` no se sube.

## Siguiente fase

Recordatorios de pago, recomendaciones (qué deuda abonar primero), endpoint para registrar gastos desde un Atajo de Apple Wallet (`transactions.source = 'wallet'` ya existe) y app móvil.
