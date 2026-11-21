// Which AI answers the advisor. Gemini goes first when its key is set because
// Google's free tier covers personal use; Claude is the alternative.

export type Provider = "gemini" | "claude";

export function aiProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

/** A free-tier Gemini model; override with GUACA_GEMINI_MODEL if Google renames it. */
export const GEMINI_MODEL = () => process.env.GUACA_GEMINI_MODEL || "gemini-3.8-flash";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** The same conversation in the shape the Gemini API expects. */
export function geminiRequest(system: string[], messages: ChatTurn[], maxTokens: number) {
  return {
    systemInstruction: { parts: system.map((text) => ({ text })) },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: maxTokens },
  };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
}

/** The answer's text, without the model's internal "thought" parts. */
export function geminiText(response: GeminiResponse): string {
  return (response.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
}
