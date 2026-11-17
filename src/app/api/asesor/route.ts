import Anthropic from "@anthropic-ai/sdk";
import { ADVISOR_SYSTEM, advisorContext } from "@/lib/advisor-context";
import { loadData } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 30;
const MAX_CHARS = 4000;

/**
 * One turn of the advisor chat. The conversation lives in the browser; each
 * question rebuilds the snapshot of the person's finances from the database
 * (with their session, so Row Level Security applies) and sends it to Claude.
 */
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "El asesor no está configurado." }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Inicia sesión de nuevo." }, { status: 401 });

  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = (body?.messages ?? []).slice(-MAX_TURNS);
  } catch {
    return Response.json({ error: "Mensaje no válido." }, { status: 400 });
  }
  const valid =
    messages.length > 0 &&
    messages.every((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length <= MAX_CHARS) &&
    messages[0].role === "user" &&
    messages[messages.length - 1].role === "user";
  if (!valid) return Response.json({ error: "Mensaje no válido." }, { status: 400 });

  const data = await loadData();
  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: process.env.GUACA_AI_MODEL || "claude-sonnet-5-5",
      max_tokens: 6000,
      system: [
        { type: "text", text: ADVISOR_SYSTEM },
        { type: "text", text: advisorContext(data) },
      ],
      messages,
    });
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return Response.json({ text: text || "No pude armar una respuesta. Intenta preguntarlo de otra forma." });
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : 500;
    const message = status === 401 ? "La clave de la API no es válida." : status === 429 ? "Demasiadas preguntas seguidas; espera un momento." : "El asesor no respondió. Intenta de nuevo.";
    return Response.json({ error: message }, { status: 502 });
  }
}
