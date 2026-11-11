import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const pendingEmailCookie = "ketcode_pending_email";
const pendingEmailOptions = { path: "/portal/login", maxAge: 3600 };

const sessionCookie = "ketcode_factory_session";
const cookieOptions = {
  path: "/portal",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;

async function authRequest(path: string, token?: string, body?: object) {
  const url = process.env.FACTORY_SUPABASE_URL;
  const key = process.env.FACTORY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return undefined;
  return fetch(new URL("/auth/v1/" + path, url), {
    method: body ? "POST" : "GET",
    headers: {
      apikey: key,
      ...(token && { Authorization: "Bearer " + token }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
}

export async function getPendingEmail() {
  return (await cookies()).get(pendingEmailCookie)?.value;
}

export async function setPendingEmail(email: string) {
  (await cookies()).set(pendingEmailCookie, email, { ...cookieOptions, ...pendingEmailOptions });
}

export async function sendCode(email: string) {
  return Boolean((await authRequest("otp", undefined, { email, create_user: true }))?.ok);
}

export async function signIn(email: string, token: string) {
  const response = await authRequest("verify", undefined, { email, token, type: "email" });
  if (!response?.ok) return false;
  const { access_token, expires_in } = await response.json();
  if (typeof access_token !== "string" || !Number.isFinite(expires_in) || expires_in <= 0) return false;
  const store = await cookies();
  store.set(sessionCookie, access_token, {
    ...cookieOptions,
    maxAge: Math.min(expires_in, 3600),
  });
  store.set(pendingEmailCookie, "", { ...cookieOptions, ...pendingEmailOptions, maxAge: 0 });
  return true;
}

export async function requirePortalEmail() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) redirect("/portal/login");
  const response = await authRequest("user", token);
  if (!response?.ok) redirect("/portal/login");
  const user: { email?: string; email_confirmed_at?: string } = await response.json();
  if (!user.email_confirmed_at || typeof user.email !== "string" || !user.email) redirect("/portal/login");
  return user.email.toLowerCase();
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;
  store.set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
  if (token) await authRequest("logout?scope=local", token, {});
}
