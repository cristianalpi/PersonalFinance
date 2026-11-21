import { test } from "node:test";
import assert from "node:assert/strict";
import { aiProvider, geminiRequest, geminiText } from "./ai-provider.ts";

test("advisor: Gemini first when both keys exist, then Claude, else off", () => {
  const saved = { g: process.env.GEMINI_API_KEY, a: process.env.ANTHROPIC_API_KEY };
  process.env.GEMINI_API_KEY = "g";
  process.env.ANTHROPIC_API_KEY = "a";
  assert.equal(aiProvider(), "gemini");
  delete process.env.GEMINI_API_KEY;
  assert.equal(aiProvider(), "claude");
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(aiProvider(), null);
  if (saved.g) process.env.GEMINI_API_KEY = saved.g;
  if (saved.a) process.env.ANTHROPIC_API_KEY = saved.a;
});

test("advisor: Gemini request and answer shapes", () => {
  const body = geminiRequest(["reglas", "datos"], [{ role: "user", content: "hola" }, { role: "assistant", content: "¿qué tal?" }, { role: "user", content: "plan" }], 100);
  assert.deepEqual(body.systemInstruction.parts, [{ text: "reglas" }, { text: "datos" }]);
  assert.deepEqual(body.contents.map((c) => c.role), ["user", "model", "user"]);
  assert.equal(geminiText({ candidates: [{ content: { parts: [{ text: "pensando", thought: true }, { text: "Abona " }, { text: "primero." }] } }] }), "Abona primero.");
  assert.equal(geminiText({}), "");
});
