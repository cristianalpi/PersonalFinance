import { AdvisorChat } from "@/components/advisor-chat";
import { PlanSimulator } from "@/components/plan-simulator";
import { cardColor } from "@/lib/banks";
import { loadData } from "@/lib/data";
import { planDebts } from "@/lib/planner";

export default async function AdvisorPage() {
  const { accounts, txs, today } = await loadData();
  const debts = planDebts(accounts, txs);
  const colors = Object.fromEntries(accounts.map((a) => [a.id, cardColor(a)]));
  const aiReady = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <div className="pt-2">
        <h1 className="display text-3xl">Asesor</h1>
        <p className="text-sm text-ink-3">Planes para pagar tus deudas y organizar tus cuentas, con tus números.</p>
      </div>

      {debts.length > 0 ? (
        <PlanSimulator debts={debts} colors={colors} startMonth={today.slice(0, 7)} />
      ) : (
        <section className="card">
          <p className="display text-xl">No tienes deudas con saldo</p>
          <p className="text-ink-2">Cuando registres tarjetas o créditos, aquí verás cuándo quedas libre de cada una.</p>
        </section>
      )}

      <div>
        <h2 className="display text-2xl">Pregúntale a la IA ✨</h2>
        <p className="text-sm text-ink-3">
          Usa tus saldos, tasas, pagos fijos, metas y la simulación de arriba. Es una guía, no asesoría financiera certificada.
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
