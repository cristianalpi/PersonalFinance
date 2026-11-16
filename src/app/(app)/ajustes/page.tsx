import { headers } from "next/headers";
import { clearWalletName } from "@/app/actions";
import { TokenCard } from "@/components/token-card";
import { loadData } from "@/lib/data";

export default async function SettingsPage() {
  const { supabase, accounts } = await loadData();
  const { data: tokens } = await supabase.from("api_tokens").select("kind");
  const has = (kind: string) => Boolean(tokens?.some((t) => t.kind === kind));
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const linked = accounts.filter((a) => a.wallet_card_name);

  return (
    <>
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <section className="card flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">Apple Wallet: registrar pagos automáticamente</h2>
          <p className="text-sm text-ink-3">
            Cada vez que pagas con Apple Pay desde el iPhone o el Apple Watch, un Atajo envía el pago aquí. No captura pagos con la tarjeta física.
          </p>
        </div>
        <TokenCard kind="wallet" exists={has("wallet")} origin={origin} />
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
          <li>En el iPhone abre Atajos → Automatización → «+» → Wallet (en iOS 17–18 se llama «Transacción»).</li>
          <li>Elige las tarjetas, marca todas las categorías y «Ejecutar inmediatamente».</li>
          <li>
            Agrega la acción «Obtener contenido de URL» con la dirección <code className="break-all">{origin}/api/wallet</code>, método POST.
          </li>
          <li>
            En Cabeceras agrega <code>Authorization</code> con el valor <code>Bearer TU_TOKEN</code>.
          </li>
          <li>
            Cuerpo JSON con tres campos de texto tomados de «Entrada del atajo»: <code>card</code> → Tarjeta o pase, <code>merchant</code> → Comercio,{" "}
            <code>amount</code> → Importe.
          </li>
          <li>Opcional: agrega «Mostrar notificación» con el campo <code>message</code> de la respuesta.</li>
        </ol>
        <p className="text-sm text-ink-3">
          La primera vez que pagues con una tarjeta, el pago llega a «por revisar» en Movimientos; al registrarlo queda vinculada y los siguientes entran solos.
        </p>
        {linked.length > 0 && (
          <ul className="divide-y divide-line text-sm">
            {linked.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  «{a.wallet_card_name}» → <span className="font-medium">{a.name}</span>
                </span>
                <form action={clearWalletName}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-ink-3 hover:text-ink">Desvincular</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <div>
          <h2 className="font-semibold">Recordatorios en tu calendario</h2>
          <p className="text-sm text-ink-3">
            Una dirección de calendario con las fechas de pago de tarjetas, créditos y recibos de los próximos tres meses, con aviso dos días antes y el mismo
            día.
          </p>
        </div>
        <TokenCard kind="calendar" exists={has("calendar")} origin={origin} />
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
          <li>En el iPhone: Ajustes → Apps → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito.</li>
          <li>Pega la dirección y, en la pantalla siguiente, desactiva «Eliminar alertas» para recibir los avisos.</li>
        </ol>
        <p className="text-sm text-ink-3">
          El calendario lleva nombres y valores fijos, no tus saldos. Quien tenga la dirección puede verlo: si se filtra, genera una nueva.
        </p>
      </section>
    </>
  );
}
