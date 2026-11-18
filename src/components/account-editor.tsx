"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteAccount, updateAccount, type FormState } from "@/app/actions";
import { CARD_COLORS, bankColor, bankKey, cardColor } from "@/lib/banks";
import type { Account } from "@/lib/finance";
import { AccountCard } from "./account-card";
import { BalanceAdjuster } from "./balance-adjuster";
import { Icon } from "./icons";
import { MoneyInput } from "./money-input";
import { SubmitButton } from "./submit-button";
import { UsageBar } from "./usage-bar";

const MAX_SIDE = 160;

/** Shrinks an uploaded image to a small square-ish data URL that fits in the database. */
async function toSmallDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", 0.86);
  // Browsers that cannot encode WebP silently return PNG; both are accepted.
  return webp.startsWith("data:image/webp")
    ? webp
    : canvas.toDataURL("image/png");
}

/**
 * The account's card and, right under it, its actions. «Editar» turns the same
 * card into a live preview: colour, image and name change on it as you edit,
 * so there is no second card to look at.
 */
export function AccountHero({
  account,
  balance,
  debt,
  today,
  movements,
}: {
  account: Account;
  balance: number;
  debt: boolean;
  today: string;
  /** How many movements deleting the account would remove. */
  movements: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [round, setRound] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev: FormState, form: FormData) => {
      const result = await updateAccount(prev, form);
      if (!result.error) {
        setEditing(false);
        setSaved(true);
      }
      return result;
    },
    {},
  );
  const [name, setName] = useState(account.name);
  const [institution, setInstitution] = useState(account.institution ?? "");
  const [last4, setLast4] = useState(account.last4 ?? "");
  const [color, setColor] = useState<string | null>(account.color ?? null);
  const [logo, setLogo] = useState<string | null>(account.logo ?? null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoLogo = bankKey(institution);

  const suggested = bankColor(institution);
  const swatches = [
    ...new Set([suggested, ...CARD_COLORS].filter(Boolean) as string[]),
  ];
  const preview = {
    kind: account.kind,
    name: name || account.name,
    institution: institution || null,
    color,
    last4: last4.length === 4 ? last4 : null,
    logo,
  };
  const shown = cardColor(preview);
  const isCard = account.kind === "credit_card";
  const isLoan = account.kind === "loan";
  const usage =
    isCard && account.credit_limit
      ? Math.max(0, balance) / account.credit_limit
      : null;

  function startEditing() {
    setSaved(false);
    setEditing(true);
  }

  function cancel() {
    // Back to what is stored; the fields remount with their saved values.
    setName(account.name);
    setInstitution(account.institution ?? "");
    setLast4(account.last4 ?? "");
    setColor(account.color ?? null);
    setLogo(account.logo ?? null);
    setImageError(null);
    setRound((r) => r + 1);
    setEditing(false);
  }

  async function pickImage(file: File | undefined | null) {
    setImageError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|heic|heif|gif)$/.test(file.type))
      return setImageError("Usa una imagen PNG, JPG o WebP.");
    try {
      setLogo(await toSmallDataUrl(file));
    } catch {
      setImageError("No se pudo leer esa imagen. Prueba con otra.");
    }
  }

  // Links ending in #editar open straight into editing.
  useEffect(() => {
    if (window.location.hash !== "#editar") return;
    const id = requestAnimationFrame(() => setEditing(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // While editing, pasting an image anywhere uses it as the card's image.
  useEffect(() => {
    if (!editing) return;
    function onPaste(e: ClipboardEvent) {
      const file = [...(e.clipboardData?.files ?? [])].find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        e.preventDefault();
        pickImage(file);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [editing]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div id="editar" className="flex scroll-mt-4 flex-col gap-3">
      {/* While editing, the card is the preview and the drop target; its logo spot opens the file picker. */}
      <div
        className={`relative w-full max-w-md rounded-3xl transition ${dragging ? "scale-[1.02] ring-4 ring-brand" : ""}`}
        onDragOver={(e) => {
          if (!editing) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (!editing) return;
          e.preventDefault();
          setDragging(false);
          pickImage(e.dataTransfer.files?.[0]);
        }}
      >
        <AccountCard
          account={editing ? preview : account}
          balance={Math.max(0, balance)}
          caption={debt ? "Lo que debes hoy" : "Lo que tienes hoy"}
          size="lg"
          morph={account.id}
        >
          {usage !== null ? <UsageBar usage={usage} onCard /> : null}
        </AccountCard>
        {editing && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rise absolute left-4 top-4 flex size-[3.25rem] items-end justify-end rounded-2xl ring-2 ring-white/70 transition hover:bg-white/10"
            aria-label="Cambiar la imagen de la tarjeta"
          >
            <span
              aria-hidden="true"
              className="flex size-6 translate-x-1.5 translate-y-1.5 items-center justify-center rounded-full bg-white text-[#14112E] shadow"
            >
              <Icon name="edit" className="size-3.5" strokeWidth={2.2} />
            </span>
          </button>
        )}
        {dragging && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-brand/70 text-sm font-semibold text-white">
            Suelta la imagen aquí
          </p>
        )}
      </div>

      {!editing ? (
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            className="liquid flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
            onClick={startEditing}
          >
            <Icon name="edit" className="size-4" />
            Editar
          </button>
          <div className="min-w-0 flex-1 basis-40 has-[form]:basis-full">
            <BalanceAdjuster
              id={account.id}
              current={balance}
              debt={debt}
              today={today}
            />
          </div>
          {saved && (
            <p
              role="status"
              className="rise basis-full text-sm font-medium text-ink-2"
            >
              ✓ Cambios guardados
            </p>
          )}
        </div>
      ) : (
        <div className="card rise flex flex-col gap-5">
          <form key={round} action={action} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={account.id} />
            <input type="hidden" name="color" value={color ?? ""} />
            <input type="hidden" name="logo" value={logo ?? ""} />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-2">Color e imagen</p>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Color de la tarjeta"
              >
                {swatches.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={shown.toUpperCase() === hex.toUpperCase()}
                    aria-label={
                      hex === suggested
                        ? `Color del banco ${hex}`
                        : `Color ${hex}`
                    }
                    onClick={() => setColor(hex === suggested ? null : hex)}
                    className="size-9 rounded-full ring-offset-2 ring-offset-bg transition-transform hover:scale-110 active:scale-95 aria-checked:ring-2 aria-checked:ring-brand"
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  className="sr-only"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => fileRef.current?.click()}
                >
                  {logo ? "Cambiar imagen" : "Subir mi imagen"}
                </button>
                {logo && (
                  <button
                    type="button"
                    className="text-sm text-ink-3 hover:text-ink"
                    onClick={() => setLogo(null)}
                  >
                    {autoLogo ? "Volver al logo automático" : "Quitar imagen"}
                  </button>
                )}
              </div>
              {imageError && (
                <p role="alert" className="alert">
                  {imageError}
                </p>
              )}
              <p className="text-xs text-ink-3">
                {suggested
                  ? `El primer color es el sugerido para ${institution}. `
                  : ""}
                {autoLogo && !logo ? "El logo de tu banco se pone solo. " : ""}
                Para otra imagen, toca el logo de la tarjeta, arrástrala encima
                o pégala.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Nombre
                <input
                  className="input"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Banco o entidad
                <input
                  className="input"
                  name="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </label>
              {(account.kind === "savings" ||
                account.kind === "credit_card") && (
                <label className="field">
                  Últimos 4 dígitos (opcional)
                  <input
                    className="input num"
                    name="last4"
                    value={last4}
                    onChange={(e) =>
                      setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    inputMode="numeric"
                    placeholder="4417"
                  />
                </label>
              )}
              {isCard && (
                <>
                  <label className="field">
                    Cupo total
                    <MoneyInput
                      name="credit_limit"
                      defaultValue={account.credit_limit}
                    />
                  </label>
                  <label className="field">
                    Día de corte
                    <input
                      className="input"
                      type="number"
                      name="statement_day"
                      min={1}
                      max={31}
                      defaultValue={account.statement_day ?? ""}
                    />
                  </label>
                  <label className="field">
                    Pago mínimo o cuota fija
                    <MoneyInput
                      name="monthly_payment"
                      defaultValue={account.monthly_payment}
                    />
                  </label>
                </>
              )}
              {isLoan && (
                <>
                  <label className="field">
                    Monto original del crédito
                    <MoneyInput
                      name="original_amount"
                      defaultValue={account.original_amount}
                    />
                  </label>
                  <label className="field">
                    Cuota mensual
                    <MoneyInput
                      name="monthly_payment"
                      defaultValue={account.monthly_payment}
                    />
                  </label>
                </>
              )}
              {(isCard || isLoan) && (
                <>
                  <label className="field">
                    Día límite de pago
                    <input
                      className="input"
                      type="number"
                      name="due_day"
                      min={1}
                      max={31}
                      defaultValue={account.due_day ?? ""}
                    />
                  </label>
                  <label className="field">
                    Tasa efectiva anual (%)
                    <input
                      className="input"
                      name="annual_rate"
                      inputMode="decimal"
                      defaultValue={
                        account.annual_rate !== null
                          ? String(account.annual_rate).replace(".", ",")
                          : ""
                      }
                    />
                  </label>
                </>
              )}
            </div>

            {state.error && (
              <p role="alert" className="alert">
                {state.error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-quiet h-11" onClick={cancel}>
                Cancelar
              </button>
              <button className="btn h-11" disabled={pending}>
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>

          <details className="border-t border-line pt-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink-3 hover:text-ink">
              Eliminar esta cuenta
            </summary>
            <form
              action={deleteAccount}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="id" value={account.id} />
              <p className="text-ink-2">
                Se borran también sus {movements} movimientos. No se puede
                deshacer.
              </p>
              <SubmitButton className="btn-quiet border-debt/40 text-ink">
                Sí, eliminar
              </SubmitButton>
            </form>
          </details>
        </div>
      )}
    </div>
  );
}
