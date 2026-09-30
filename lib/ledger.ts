export type Member = { id: string; name: string };
export type Expense = { id: string; title: string; amount: number; payerId: string; participantIds: string[]; createdAt: number };
export type Transfer = { from: string; to: string; amount: number };

export function splitAmount(amount: number, count: number): number[] {
  if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(count) || count < 1) return [];
  const base = Math.floor(amount / count);
  const remainder = amount % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function calculateSettlement(members: Member[], expenses: Expense[]) {
  const balance = new Map(members.map((member) => [member.id, 0]));
  let total = 0;
  for (const expense of expenses) {
    const participants = members.filter((member) => expense.participantIds.includes(member.id));
    if (!balance.has(expense.payerId) || participants.length === 0) continue;
    total += expense.amount;
    balance.set(expense.payerId, balance.get(expense.payerId)! + expense.amount);
    splitAmount(expense.amount, participants.length).forEach((share, index) => {
      const id = participants[index].id;
      balance.set(id, balance.get(id)! - share);
    });
  }
  const debtors = members.map((member) => ({ id: member.id, amount: -(balance.get(member.id) ?? 0) })).filter((entry) => entry.amount > 0);
  const creditors = members.map((member) => ({ id: member.id, amount: balance.get(member.id) ?? 0 })).filter((entry) => entry.amount > 0);
  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
    transfers.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount });
    debtors[debtorIndex].amount -= amount;
    creditors[creditorIndex].amount -= amount;
    if (debtors[debtorIndex].amount === 0) debtorIndex++;
    if (creditors[creditorIndex].amount === 0) creditorIndex++;
  }
  return { total, balances: members.map((member) => ({ ...member, amount: balance.get(member.id) ?? 0 })), transfers };
}
