"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendCode, signIn } from "../../../lib/factory/auth";
import { portalEnabled } from "../../../lib/factory/portal";
import { isRateLimited } from "../../../lib/rate-limit";

const emailInput = z.string().trim().toLowerCase().pipe(z.email().max(254));
const tokenInput = z.string().trim().regex(/^\d{6,10}$/);

async function limited(operation: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return isRateLimited("portal:auth:" + operation + ":" + ip, 10, 60_000);
}

export async function requestCode(form: FormData) {
  const email = emailInput.safeParse(form.get("email"));
  if (!portalEnabled() || !email.success || await limited("send") || !await sendCode(email.data)) {
    redirect("/portal/login?error=send");
  }
  redirect("/portal/login?sent=1");
}

export async function verifyCode(form: FormData) {
  const email = emailInput.safeParse(form.get("email"));
  const token = tokenInput.safeParse(form.get("token"));
  if (!portalEnabled() || !email.success || !token.success || await limited("verify") ||
      !await signIn(email.data, token.data)) {
    redirect("/portal/login?sent=1&error=verify");
  }
  redirect("/portal");
}
