import { AdvisorChat } from "@/components/advisor-chat";
import Link from "next/link";
import { loadData } from "@/lib/data";

export default async function AdvisorPage() {
  await loadData(); // signed-in check
  const aiReady = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <div className="pt-2">
        <h1 className="display text-3xl">Asesor ✨</h1>
        <p className="text-sm text-ink-3">
          Pregúntale cómo pagar tus deudas, cuánto ahorrar para una meta o cómo repartir el salario. Usa tus saldos, tasas, pagos fijos, ingresos, presupuestos y metas. Es una guía, no asesoría financiera certificada. Para simular abonos, mira el{" "}
          <Link href="/deudas#plan" className="font-medium text-brand">
            plan de pagos
          </Link>
          .
        </p>
      </div>

      {aiReady ? (
        <AdvisorChat />
      ) : (
        <section className="card flex flex-col gap-2 text-sm text-ink-2">
          <p className="font-semibold text-ink">El asesor con IA aún no está encendido.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Crea una clave en <span className="font-medium text-ink">platform.claude.com</span> (API Keys) y carga saldo de uso.
            </li>
            <li>
              En Vercel → tu proyecto → Settings → Environment Variables, agrega <code>ANTHROPIC_API_KEY</code> con esa clave.
            </li>
            <li>Vuelve a desplegar. Este recuadro se convierte en el chat.</li>
          </ol>
          <p className="text-xs text-ink-3">
            Cada pregunta envía a la API de Anthropic un resumen de tus cuentas (saldos, tasas, pagos fijos, metas). Sale en centavos de dólar por pregunta.
          </p>
        </section>
      )}
    </>
  );
}
