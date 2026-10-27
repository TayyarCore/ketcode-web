import { chatRequestSchema, assistantInstructions, publicError } from "../../../lib/ai-sales-assistant";
import { isRateLimited, requestIdentity } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60 * 60 * 1000;

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

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    return Response.json({ error: publicError(language, "configuration") }, { status: 503 });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": new URL(request.url).origin,
        "X-Title": "Ket Code AI Sales Assistant Preview",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: assistantInstructions(language) }, ...messages],
        max_tokens: 220,
        user: sessionId,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`OpenRouter response failed with ${response.status}`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new Error("OpenRouter response contained no text");

    return Response.json({ reply: reply.slice(0, 1_500) });
  } catch (error) {
    console.error("AI sales assistant request failed", error);
    return Response.json({ error: publicError(language, "unavailable") }, { status: 502 });
  }
}
