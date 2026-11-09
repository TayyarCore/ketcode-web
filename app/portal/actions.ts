"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isRateLimited } from "../../lib/rate-limit";
import { accessPattern, approveProject, createProject, findProject, portalCookie, portalEnabled } from "../../lib/factory/portal";

const registration = z.object({
  code: z.string().regex(accessPattern),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  template: z.enum(["office", "projects"]),
  consent: z.literal("on"),
});

async function limited(operation: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return isRateLimited("portal:" + operation + ":" + ip, 10, 60_000);
}

async function saveSession(code: string) {
  (await cookies()).set(portalCookie, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function registerProject(form: FormData) {
  if (!portalEnabled() || await limited("register")) redirect("/portal?error=unavailable");
  const parsed = registration.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/portal?error=registration");
  const { code, name, email, template } = parsed.data;
  try {
    if (!await createProject(code, name, email, template)) throw new Error("Project missing");
    await saveSession(code);
  } catch {
    redirect("/portal?error=unavailable");
  }
  redirect("/portal");
}

export async function openProject(form: FormData) {
  if (!portalEnabled() || await limited("open")) redirect("/portal?error=unavailable");
  const code = String(form.get("code") ?? "").trim();
  const project = await findProject(code).catch(() => null);
  if (project === null) redirect("/portal?error=unavailable");
  if (!project) redirect("/portal?error=access");
  await saveSession(code);
  redirect("/portal");
}

export async function acceptPreview(form: FormData) {
  if (!portalEnabled()) redirect("/portal?error=unavailable");
  const code = (await cookies()).get(portalCookie)?.value ?? "";
  const preview = String(form.get("preview") ?? "");
  const approved = await approveProject(code, preview).catch(() => false);
  redirect(approved ? "/portal" : "/portal?error=preview");
}

export async function closeProject() {
  (await cookies()).set(portalCookie, "", { path: "/portal", maxAge: 0 });
  redirect("/portal");
}
