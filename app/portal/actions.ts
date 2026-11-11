"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePortalEmail, signOut } from "../../lib/factory/auth";
import { isRateLimited } from "../../lib/rate-limit";
import { accessPattern, approveProject, createProject, portalEnabled, projectIdPattern, safePreview, updateProjectDetails, updateMaterials } from "../../lib/factory/portal";

const contact = z.object({
  contact_name: z.string().trim().min(2).max(100),
  contact_phone: z.string().trim().max(32).transform((value) => value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) & 15)).replace(/[ ()-]/g, ""))
    .pipe(z.string().regex(/^(?:05\d{8}|\+?[1-9]\d{7,14})$/))
    .transform((value) => value.startsWith("05") ? "+966" + value.slice(1) : value),
});

const registrationNumber = z.string().trim().transform((value) =>
  value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) & 15)))
  .pipe(z.string().regex(/^\d{1,30}$/));

const websiteUrl = z.string().max(2048).transform((value) => safePreview(value)).pipe(z.string().max(2048));

const business = z.object({
  commercial_registration: registrationNumber,
  fal_license: registrationNumber,
  city: z.string().trim().min(2).max(100),
  map_url: z.string().trim().pipe(z.union([z.literal(""), websiteUrl])).transform((value) => value || null),
  social_links: z.string().max(10000).transform((value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
    .pipe(z.array(websiteUrl).max(6)),
  working_hours: z.string().trim().max(500).transform((value) => value || null),
});

const registration = contact.extend({
  ...business.shape,
  code: z.string().regex(accessPattern),
  name: z.string().trim().min(2).max(100),
  template: z.enum(["office", "projects"]),
  consent: z.literal("on"),
});

async function limited(operation: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return isRateLimited("portal:" + operation + ":" + ip, 10, 60_000);
}

function projectPath(id: string, status = "") {
  return "/portal?project=" + id + status;
}

function submittedProject(form: FormData) {
  const id = String(form.get("project") ?? "");
  if (!projectIdPattern.test(id)) redirect("/portal?error=access");
  return id;
}

export async function registerProject(form: FormData) {
  const email = await requirePortalEmail();
  if (!portalEnabled() || await limited("register")) redirect("/portal?error=unavailable");
  const parsed = registration.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/portal?error=registration");
  const { code, name, template, contact_name, contact_phone, commercial_registration, fal_license, city, map_url, social_links, working_hours } = parsed.data;
  const project = await createProject(code, name, email, template, { contact_name, contact_phone, commercial_registration, fal_license, city, map_url, social_links, working_hours }).catch(() => undefined);
  if (!project) redirect("/portal?error=unavailable");
  redirect(projectPath(project.id));
}

export async function acceptPreview(form: FormData) {
  const email = await requirePortalEmail();
  if (!portalEnabled()) redirect("/portal?error=unavailable");
  const id = submittedProject(form);
  const preview = String(form.get("preview") ?? "");
  const approved = await approveProject(email, id, preview).catch(() => false);
  redirect(projectPath(id, approved ? "" : "&error=preview"));
}

export async function closeProject() {
  await signOut();
  redirect("/portal/login");
}

export async function saveMaterials(form: FormData) {
  const email = await requirePortalEmail();
  if (!portalEnabled() || await limited("materials")) redirect("/portal?error=unavailable");
  const id = submittedProject(form);
  const values = String(form.get("references") ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const urls = values.map((value) => {
    try {
      const url = new URL(value);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password && url.href.length <= 300) return url.href;
    } catch {
      return undefined;
    }
  });
  if (urls.length > 5 || urls.some((url) => !url)) redirect(projectPath(id, "&error=references"));

  const file = form.get("logo");
  let logo: { name: string; data: string } | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 512 * 1024) redirect(projectPath(id, "&error=logo"));
    const bytes = Buffer.from(await file.arrayBuffer());
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!png && !jpeg && !webp) redirect(projectPath(id, "&error=logo"));
    logo = { name: file.name.slice(0, 120), data: bytes.toString("base64") };
  }

  const saved = await updateMaterials(email, id, urls.filter((url): url is string => Boolean(url)), logo).catch(() => false);
  redirect(projectPath(id, saved ? "&saved=materials" : "&error=materials"));
}

export async function saveContact(form: FormData) {
  const email = await requirePortalEmail();
  if (!portalEnabled() || await limited("contact")) redirect("/portal?error=unavailable");
  const id = submittedProject(form);
  const parsed = contact.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(projectPath(id, "&error=contact"));
  const saved = await updateProjectDetails(email, id, parsed.data).catch(() => false);
  redirect(projectPath(id, saved ? "&saved=contact" : "&error=contact"));
}

export async function saveBusiness(form: FormData) {
  const email = await requirePortalEmail();
  if (!portalEnabled() || await limited("business")) redirect("/portal?error=unavailable");
  const id = submittedProject(form);
  const parsed = business.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(projectPath(id, "&error=business"));
  const saved = await updateProjectDetails(email, id, parsed.data).catch(() => false);
  redirect(projectPath(id, saved ? "&saved=business" : "&error=business"));
}
