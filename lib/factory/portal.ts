import { createHash, randomBytes, randomUUID } from "node:crypto";

export const portalCookie = "ketcode_project";
export const accessPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.[A-Za-z0-9_-]{43}$/;

export type Project = {
  id: string;
  name: string;
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

function accessQuery(code: string) {
  const [id] = code.split(".");
  return new URLSearchParams({ id: "eq." + id, access_hash: "eq." + hash(code) });
}

function hash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

async function database(query: URLSearchParams, method = "GET", body?: object) {
  if (!portalEnabled()) throw new Error("Portal is disabled");
  const url = new URL("/rest/v1/white_friday_projects", process.env.FACTORY_SUPABASE_URL);
  url.search = query.toString();
  const response = await fetch(url, {
    method,
    headers: {
      apikey: process.env.FACTORY_SUPABASE_SECRET_KEY!,
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

const projectColumns = "id,name,template,stage,preview_url,approved_preview_url,reference_urls,logo_name";

export async function findProject(email: string, code?: string) {
  if (!code || !accessPattern.test(code)) return undefined;
  const query = accessQuery(code);
  query.set("select", projectColumns + ",email");
  const project = (await database(query))[0];
  return project?.email.toLowerCase() === email ? project : undefined;
}

export async function createProject(code: string, name: string, email: string, template: Project["template"]) {
  const [id] = code.split(".");
  const rows = await database(new URLSearchParams({ select: projectColumns }), "POST", {
    id, name, email, template, access_hash: hash(code),
  });
  return rows[0] ?? await findProject(email, code);
}

export function safePreview(value: string | null) {
  try {
    const url = new URL(value ?? "");
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch {
    return undefined;
  }
}

export async function approveProject(email: string, code: string, preview: string) {
  if (!accessPattern.test(code) || !safePreview(preview)) return false;
  const project = await findProject(email, code);
  if (!project) return false;
  const query = accessQuery(code);
  query.set("email", "eq." + project.email);
  query.set("stage", "eq.review");
  query.set("preview_url", "eq." + preview);
  query.set("select", "id");
  return (await database(query, "PATCH", { approved_preview_url: preview })).length === 1;
}

export async function updateMaterials(email: string, code: string, referenceUrls: string[], logo?: { name: string; data: string }) {
  const project = await findProject(email, code);
  if (!project) return false;
  const query = accessQuery(code);
  query.set("email", "eq." + project.email);
  query.set("stage", "in.(received,building)");
  query.set("select", "id");
  return (await database(query, "PATCH", {
    reference_urls: referenceUrls,
    ...(logo && { logo_name: logo.name, logo_data: logo.data }),
  })).length === 1;
}
