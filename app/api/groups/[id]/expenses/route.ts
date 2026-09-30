import { getDb } from "@/db";
import { getGroup, jsonError, newId, serverError, validateExpense } from "@/lib/group-store";
import { cors, OPTIONS } from "@/lib/cors";

export { OPTIONS };

type Context = { params: Promise<{ id: string }> };

export const POST = cors(async function post(request: Request, context: Context) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return jsonError("入力内容を確認してください。", 400); }
  try {
    const group = await getGroup((await context.params).id);
    if (!group) return jsonError("グループが見つかりません。", 404);
    const input = validateExpense(body, group.members);
    if (!input) return jsonError("金額・支払った人・割り勘する人を確認してください。", 400);
    const db = getDb();
    const id = newId();
    await db.batch([
      db.prepare("INSERT INTO expenses (id, group_id, title, amount, payer_id, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, group.id, input.title, input.amount, input.payerId, Date.now()),
      ...input.participantIds.map((memberId) => db.prepare("INSERT INTO expense_participants (expense_id, member_id) VALUES (?, ?)").bind(id, memberId)),
    ]);
    return Response.json({ id }, { status: 201 });
  } catch (error) { return serverError(error); }
});
