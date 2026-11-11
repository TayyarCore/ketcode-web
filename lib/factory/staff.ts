import { notFound } from "next/navigation";
import { requirePortalEmail } from "./auth";
import { portalEnabled } from "./portal";

export function isFactoryStaff(email: string) {
  return (process.env.FACTORY_STAFF_EMAILS ?? "").split(",")
    .some((entry) => entry.trim().toLowerCase() === email);
}

export async function requireFactoryStaff() {
  if (!portalEnabled() || !isFactoryStaff(await requirePortalEmail())) notFound();
}
