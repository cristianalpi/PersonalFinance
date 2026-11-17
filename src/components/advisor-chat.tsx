"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Arma un plan para salir de mis tarjetas, mes a mes",
  "¿A qué deuda le meto la plata extra este mes?",
  "Plan de amortización solo para una de mis tarjetas",
  "¿Cuánto debo ahorrar para cumplir mis metas?",
];

/** Chat with the advisor. The conversation stays in this browser tab; nothing is stored. */
export function AdvisorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/asesor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El asesor no respondió.");
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "El asesor no respondió.");
      setMessages(messages);
      setInput(question);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-col gap-4" aria-label="Chat con el asesor">
      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip text-left" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} className={`rise max-w-[92%] rounded-3xl px-4 py-3 ${m.role === "user" ? "self-end bg-brand text-white" : "self-start bg-surface/70"}`}>
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="advisor-md text-[15px] leading-relaxed">
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                </div>
              )}
            </li>
          ))}
          {busy && (
            <li className="self-start rounded-3xl bg-surface/70 px-4 py-3" role="status" aria-label="El asesor está pensando">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </li>
          )}
        </ol>
      )}
      <div ref={end} />
      {error && <p role="alert" className="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          className="input min-h-12 resize-none"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Pregúntale a tu asesor…"
          aria-label="Tu pregunta"
          maxLength={4000}
        />
        <button className="btn h-12 shrink-0" disabled={busy || !input.trim()}>
          Enviar
        </button>
      </form>
      {messages.length > 0 && (
        <button type="button" className="self-start text-sm text-ink-3 hover:text-ink" onClick={() => setMessages([])}>
          Empezar de nuevo
        </button>
      )}
    </section>
  );
}
