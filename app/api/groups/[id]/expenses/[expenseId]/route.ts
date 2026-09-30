import { getDb } from "@/db";
import { getGroup, jsonError, serverError, validateExpense } from "@/lib/group-store";
import { cors, OPTIONS } from "@/lib/cors";

export { OPTIONS };

type Context = { params: Promise<{ id: string; expenseId: string }> };

export const PATCH = cors(async function patch(request: Request, context: Context) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return jsonError("入力内容を確認してください。", 400); }
  try {
    const { id, expenseId } = await context.params;
    const group = await getGroup(id);
    if (!group || !group.expenses.some((expense) => expense.id === expenseId)) return jsonError("支払いが見つかりません。", 404);
    const input = validateExpense(body, group.members);
    if (!input) return jsonError("金額・支払った人・割り勘する人を確認してください。", 400);
    const db = getDb();
    await db.batch([
      db.prepare("UPDATE expenses SET title = ?, amount = ?, payer_id = ? WHERE id = ? AND group_id = ?").bind(input.title, input.amount, input.payerId, expenseId, id),
      db.prepare("DELETE FROM expense_participants WHERE expense_id = ?").bind(expenseId),
      ...input.participantIds.map((memberId) => db.prepare("INSERT INTO expense_participants (expense_id, member_id) VALUES (?, ?)").bind(expenseId, memberId)),
    ]);
    return Response.json({ ok: true });
  } catch (error) { return serverError(error); }
});

export const DELETE = cors(async function remove(_request: Request, context: Context) {
  try {
    const { id, expenseId } = await context.params;
    const group = await getGroup(id);
    if (!group || !group.expenses.some((expense) => expense.id === expenseId)) return jsonError("支払いが見つかりません。", 404);
    const db = getDb();
    await db.batch([
      db.prepare("DELETE FROM expense_participants WHERE expense_id = ?").bind(expenseId),
      db.prepare("DELETE FROM expenses WHERE id = ? AND group_id = ?").bind(expenseId, id),
    ]);
    return Response.json({ ok: true });
  } catch (error) { return serverError(error); }
});
