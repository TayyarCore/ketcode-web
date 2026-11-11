"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireFactoryStaff } from "../../../lib/factory/staff";
import { projectIdPattern, safePreview, updateStaffProjectStage } from "../../../lib/factory/portal";

const input = z.object({
  project: z.string().regex(projectIdPattern),
  operation: z.enum(["build", "review", "launch"]),
});

export async function changeStage(form: FormData) {
  await requireFactoryStaff();
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/portal/staff?error=1");
  const { project, operation } = parsed.data;
  const url = safePreview(String(form.get("preview") ?? "").trim());
  const saved = await updateStaffProjectStage(project, operation, url).catch(() => false);
  redirect(saved ? "/portal/staff?saved=1" : "/portal/staff?error=1");
}
