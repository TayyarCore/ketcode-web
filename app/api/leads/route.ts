import { leadRequestSchema, publicError } from "../../../lib/ai-sales-assistant";
import { isRateLimited, requestIdentity } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const LEAD_LIMIT = 3;
const LEAD_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = leadRequestSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const lead = parsed.data;
  if (isRateLimited(`lead:${requestIdentity(request, lead.sessionId)}`, LEAD_LIMIT, LEAD_WINDOW_MS)) {
    return Response.json({ error: publicError(lead.language, "unavailable") }, { status: 429 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const notificationEmail = process.env.SALES_NOTIFICATION_EMAIL || "info@ketcode.com";

  if (!supabaseUrl || !secretKey) {
    return Response.json({ error: publicError(lead.language, "configuration") }, { status: 503 });
  }

  try {
    const endpoint = new URL("/rest/v1/leads", supabaseUrl);
    endpoint.searchParams.set("on_conflict", "session_id");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: secretKey,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        language: lead.language,
        name: lead.name,
        contact_method: lead.contactMethod,
        contact: lead.contact,
        source_page: lead.sourcePage,
        session_id: lead.sessionId,
        service: "website-design",
        conversation: lead.messages,
        consent_at: new Date().toISOString(),
        sales_notification_email: notificationEmail,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) throw new Error(`Supabase insert failed with ${response.status}`);
    return Response.json({ saved: true });
  } catch (error) {
    console.error("Lead storage failed", error);
    return Response.json({ error: publicError(lead.language, "unavailable") }, { status: 502 });
  }
}
