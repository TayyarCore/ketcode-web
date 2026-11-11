import { getStaffProjectLogo } from "../../../../lib/factory/portal";
import { requireFactoryStaff } from "../../../../lib/factory/staff";

export async function GET(request: Request) {
  await requireFactoryStaff();
  const id = new URL(request.url).searchParams.get("project") ?? "";
  const data = await getStaffProjectLogo(id);
  if (!data) return new Response(null, { status: 404 });
  const bytes = Buffer.from(data, "base64");
  const type = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
    : bytes.subarray(0, 3).equals(Buffer.from([255,216,255])) ? "image/jpeg"
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : undefined;
  if (!type) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
