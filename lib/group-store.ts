import { getDb } from "@/db";
import type { Expense, Member } from "@/lib/ledger";

export type Group = { id: string; title: string; members: Member[]; expenses: Expense[] };

type GroupRow = { id: string; title: string };
type MemberRow = { id: string; name: string };
type ExpenseRow = { id: string; title: string; amount: number; payer_id: string; created_at: number };
type ParticipantRow = { expense_id: string; member_id: string };

export function validId(id: string) { return /^[a-f0-9]{32}$/.test(id); }
export function newId() { return crypto.randomUUID().replaceAll("-", ""); }

export async function getGroup(id: string): Promise<Group | null> {
  if (!validId(id)) return null;
  const db = getDb();
  const group = await db.prepare("SELECT id, title FROM groups WHERE id = ?").bind(id).first<GroupRow>();
  if (!group) return null;
  const [memberResult, expenseResult, participantResult] = await Promise.all([
    db.prepare("SELECT id, name FROM members WHERE group_id = ? ORDER BY created_at, id").bind(id).all<MemberRow>(),
    db.prepare("SELECT id, title, amount, payer_id, created_at FROM expenses WHERE group_id = ? ORDER BY created_at DESC, id DESC").bind(id).all<ExpenseRow>(),
    db.prepare("SELECT ep.expense_id, ep.member_id FROM expense_participants ep JOIN expenses e ON e.id = ep.expense_id WHERE e.group_id = ?").bind(id).all<ParticipantRow>(),
  ]);
  const members = memberResult.results.map((member) => ({ id: member.id, name: member.name }));
  const expenses = expenseResult.results.map((expense) => ({
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    payerId: expense.payer_id,
    participantIds: participantResult.results.filter((row) => row.expense_id === expense.id).map((row) => row.member_id),
    createdAt: expense.created_at,
  }));
  return { id: group.id, title: group.title, members, expenses };
}

export function cleanName(value: unknown, max = 40): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateExpense(input: Record<string, unknown>, members: Member[]) {
  const title = cleanName(input.title, 80);
  const amount = Number(input.amount);
  const payerId = input.payerId;
  const participantIds = input.participantIds;
  const memberIds = new Set(members.map((member) => member.id));
  if (!title || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000 || typeof payerId !== "string" || !memberIds.has(payerId) || !Array.isArray(participantIds) || participantIds.length === 0 || participantIds.length > members.length || participantIds.some((id) => typeof id !== "string" || !memberIds.has(id)) || new Set(participantIds).size !== participantIds.length) return null;
  return { title, amount, payerId, participantIds: participantIds as string[] };
}

export function jsonError(message: string, status: number) { return Response.json({ error: message }, { status }); }
export function serverError(error: unknown) {
  console.error("Group storage failed", error);
  return jsonError("保存に失敗しました。少し待ってから再度お試しください。", 500);
}
