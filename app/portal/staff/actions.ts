"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireFactoryStaff } from "../../../lib/factory/staff";
import { projectIdPattern, recordStaffPayment, safePreview, updateStaffProjectStage } from "../../../lib/factory/portal";

import { verifyProjectPayment } from "../../../lib/factory/payment";

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

const paymentInput = z.object({
  project: z.string().regex(projectIdPattern),
  session: z.string().trim().max(250).regex(/^cs_(?:test|live)_[a-zA-Z0-9]+$/),
});

export async function confirmPayment(form: FormData) {
  await requireFactoryStaff();
  const parsed = paymentInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/portal/staff?error=payment");
  const { project, session } = parsed.data;
  const verified = await verifyProjectPayment(project, session).catch(() => undefined);
  const saved = verified && await recordStaffPayment(project, verified).catch(() => false);
  redirect(saved ? "/portal/staff?saved=payment" : "/portal/staff?error=payment");
}
