import { chatRequestSchema, assistantInstructions, publicError } from "../../../lib/ai-sales-assistant";
import { isRateLimited, requestIdentity } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60 * 60 * 1000;

function outputText(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("output" in payload) || !Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
      return item.content.flatMap((content: unknown) => {
        if (!content || typeof content !== "object" || !("text" in content)) return [];
        return typeof content.text === "string" ? [content.text] : [];
      });
    })
    .join("\n")
    .trim();
}

async function isFlagged(apiKey: string, text: string) {
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Moderation failed with ${response.status}`);
  const payload = (await response.json()) as { results?: Array<{ flagged?: boolean }> };
  return payload.results?.[0]?.flagged === true;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return Response.json({ error: "Request too large." }, { status: 413 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { sessionId, language, messages } = parsed.data;
  if (isRateLimited(`chat:${requestIdentity(request, sessionId)}`, CHAT_LIMIT, CHAT_WINDOW_MS)) {
    return Response.json({ error: publicError(language, "unavailable") }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return Response.json({ error: publicError(language, "configuration") }, { status: 503 });
  }

  try {
    const lastUserMessage = messages.at(-1)?.content ?? "";
    if (await isFlagged(apiKey, lastUserMessage)) {
      return Response.json({ reply: publicError(language, "unsafe") });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: assistantInstructions(language),
        input: messages,
        max_output_tokens: 220,
        store: false,
        safety_identifier: sessionId,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`OpenAI response failed with ${response.status}`);
    const reply = outputText(await response.json());
    if (!reply) throw new Error("OpenAI response contained no text");

    return Response.json({ reply: reply.slice(0, 1_500) });
  } catch (error) {
    console.error("AI sales assistant request failed", error);
    return Response.json({ error: publicError(language, "unavailable") }, { status: 502 });
  }
}
