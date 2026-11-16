"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="max-w-xl pt-6">
      <h1 className="display text-3xl">No se pudieron cargar tus datos</h1>
      <p className="mt-3 text-ink-2">
        Lo más común es que falte ejecutar una migración en Supabase o que no haya conexión. Tus saldos no cambiaron.
      </p>
      {error.message && <p className="alert mt-4 break-words">{error.message}</p>}
      <button className="btn mt-5" onClick={reset}>
        Volver a intentar
      </button>
    </section>
  );
}
