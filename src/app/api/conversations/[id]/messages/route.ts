import { getCurrentUser } from "@/lib/auth";
import { loadMessages, markConversationRead, readReceipts } from "@/lib/chat";
import { getConversationForUser } from "@/lib/queries";

export async function GET(req: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const found = await getConversationForUser(id, user);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });

  const afterParam = Number(new URL(req.url).searchParams.get("after"));
  const after = Number.isFinite(afterParam) && afterParam > 0 ? afterParam : undefined;

  const items = await loadMessages(id, user.id, after);
  if (found.isParticipant && items.some((m) => !m.mine && !m.readAt)) await markConversationRead(id, user.id);

  return Response.json(
    { messages: items, lastRead: await readReceipts(id, user.id) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
