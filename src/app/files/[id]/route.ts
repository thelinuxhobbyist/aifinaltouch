import { and, eq } from "drizzle-orm";
import { interests, requestAttachments, requests, uploads } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { cfEnv, getDb } from "@/lib/cf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound() {
  return new Response("Not found", { status: 404 });
}

export async function GET(_req: Request, ctx: RouteContext<"/files/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return notFound();

  const db = getDb();
  const upload = await db.query.uploads.findFirst({ where: eq(uploads.id, id) });
  if (!upload) return notFound();

  let cacheControl = "public, max-age=86400";

  if (upload.purpose === "request_attachment") {
    const user = await getCurrentUser();
    const link = await db
      .select({ request: requests })
      .from(requestAttachments)
      .innerJoin(requests, eq(requests.id, requestAttachments.requestId))
      .where(eq(requestAttachments.uploadId, upload.id))
      .get();

    const isOwnerOrAdmin = !!user && (user.id === upload.ownerUserId || user.isAdmin);
    let allowed = isOwnerOrAdmin;
    if (!allowed && link && (link.request.status === "published" || link.request.status === "closed")) {
      if (upload.visibility === "public") {
        allowed = true;
      } else if (user) {
        const interest = await db.query.interests.findFirst({
          where: and(eq(interests.requestId, link.request.id), eq(interests.specialistUserId, user.id)),
          columns: { id: true },
        });
        allowed = !!interest;
      }
    }
    if (!allowed) return notFound();
    if (upload.visibility === "private" || link?.request.status !== "published") cacheControl = "private, no-store";
  }

  const object = await cfEnv().UPLOADS.get(upload.r2Key);
  if (!object) return notFound();

  const isPdf = upload.contentType === "application/pdf";
  return new Response(object.body, {
    headers: {
      "Content-Type": upload.contentType,
      "Content-Length": String(upload.size),
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Content-Disposition": `${isPdf ? "attachment" : "inline"}; filename="${upload.originalName.replace(/"/g, "")}"`,
    },
  });
}
