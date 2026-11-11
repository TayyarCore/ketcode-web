const amount = 79900;
const currency = "sar";

type CheckoutSession = {
  id: string;
  object: string;
  client_reference_id: string | null;
  payment_link: string | null;
  amount_total: number | null;
  currency: string | null;
  status: string;
  payment_status: string;
  livemode: boolean;
  mode: string;
};

export async function verifyProjectPayment(projectId: string, sessionId: string) {
  const environment = process.env.VERCEL_ENV;
  if (environment !== "preview" && environment !== "production") return undefined;
  const live = environment === "production";
  const key = process.env.FACTORY_STRIPE_VERIFY_KEY;
  const link = process.env.FACTORY_STRIPE_VERIFY_LINK_ID;
  if (!key || !link?.startsWith("plink_") || !new RegExp(live ? "^cs_live_[a-zA-Z0-9]+$" : "^cs_test_[a-zA-Z0-9]+$").test(sessionId)) return undefined;

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
    headers: { Authorization: "Bearer " + key },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return undefined;
  const session: CheckoutSession = await response.json();
  if (session.object !== "checkout.session" || session.id !== sessionId || session.client_reference_id !== projectId ||
      session.payment_link !== link || session.amount_total !== amount || session.currency !== currency ||
      session.status !== "complete" || session.payment_status !== "paid" ||
      session.livemode !== live || session.mode !== "payment") return undefined;

  return { sessionId, test: !live };
}
