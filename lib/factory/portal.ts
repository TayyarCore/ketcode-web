import { createHash, randomBytes, randomUUID } from "node:crypto";

export const projectIdPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
export const accessPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.[A-Za-z0-9_-]{43}$/;

export type Project = {
  id: string;
  name: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  commercial_registration?: string | null;
  fal_license?: string | null;
  city?: string | null;
  map_url?: string | null;
  social_links?: string[];
  working_hours?: string | null;
  template: "office" | "projects";
  stage: "received" | "building" | "review" | "paid" | "launched";
  preview_url: string | null;
  approved_preview_url: string | null;
  reference_urls: string[];
  logo_name: string | null;
};

export function portalEnabled() {
  return process.env.FACTORY_ENABLED === "true" &&
    Boolean(process.env.FACTORY_SUPABASE_URL && process.env.FACTORY_SUPABASE_SECRET_KEY &&
      process.env.FACTORY_SUPABASE_PUBLISHABLE_KEY);
}

export function newAccessCode() {
  return randomUUID() + "." + randomBytes(32).toString("base64url");
}

function projectQuery(email: string, id?: string) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new URLSearchParams({ email: "imatch.^" + escapedEmail + "$", ...(id && { id: "eq." + id }) });
}

function hash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

async function database(query: URLSearchParams, method = "GET", body?: object) {
  const key = process.env.FACTORY_SUPABASE_SECRET_KEY;
  if (!key || !portalEnabled()) throw new Error("Portal is disabled");
  const url = new URL("/rest/v1/white_friday_projects", process.env.FACTORY_SUPABASE_URL);
  url.search = query.toString();
  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      // Legacy service_role keys are JWTs. Current secret keys use apikey alone.
      ...(key.startsWith("eyJ") && { Authorization: "Bearer " + key }),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 409 && method === "POST") return [];
  if (!response.ok) throw new Error("Portal storage returned " + response.status);
  return await response.json() as (Project & { email: string })[];
}

const projectColumns = "id,name,template,stage,preview_url,approved_preview_url,reference_urls,logo_name,contact_name,contact_phone,commercial_registration,fal_license,city,map_url,social_links,working_hours";

export async function listProjects(email: string) {
  const query = projectQuery(email);
  query.set("select", "id,name,template,stage");
  query.set("order", "created_at.desc,id.desc");
  return database(query);
}

export async function findProject(email: string, id: string) {
  if (!projectIdPattern.test(id)) return undefined;
  const query = projectQuery(email, id);
  query.set("select", projectColumns);
  return (await database(query))[0];
}

type Contact = { contact_name: string; contact_phone: string };
type Registration = {
  commercial_registration: string;
  fal_license: string;
  city: string;
  map_url: string | null;
  social_links: string[];
  working_hours: string | null;
};

export async function createProject(code: string, name: string, email: string, template: Project["template"], details: Contact & Registration) {
  const [id] = code.split(".");
  const rows = await database(new URLSearchParams({ select: projectColumns }), "POST", {
    id, name, email, template, access_hash: hash(code), ...details,
  });
  return rows[0] ?? await findProject(email, id);
}

export function safePreview(value: string | null) {
  try {
    const url = new URL(value ?? "");
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch {
    return undefined;
  }
}

export async function approveProject(email: string, id: string, preview: string) {
  if (!safePreview(preview)) return false;
  if (!projectIdPattern.test(id)) return false;
  const query = projectQuery(email, id);
  query.set("stage", "eq.review");
  query.set("preview_url", "eq." + preview);
  query.set("select", "id");
  return (await database(query, "PATCH", { approved_preview_url: preview })).length === 1;
}

export async function updateMaterials(email: string, id: string, referenceUrls: string[], logo?: { name: string; data: string }) {
  if (!projectIdPattern.test(id)) return false;
  const query = projectQuery(email, id);
  query.set("stage", "in.(received,building)");
  query.set("select", "id");
  return (await database(query, "PATCH", {
    reference_urls: referenceUrls,
    ...(logo && { logo_name: logo.name, logo_data: logo.data }),
  })).length === 1;
}

export async function updateProjectDetails(email: string, id: string, details: Contact | Registration) {
  if (!projectIdPattern.test(id)) return false;
  const query = projectQuery(email, id);
  query.set("select", "id");
  return (await database(query, "PATCH", details)).length === 1;
}
