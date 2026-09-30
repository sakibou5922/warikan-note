"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Pencil, Plus, ReceiptText, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { calculateSettlement, type Expense, type Member } from "@/lib/ledger";

type Group = { id: string; title: string; members: Member[]; expenses: Expense[] };
const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

async function send<T = { ok?: boolean; error?: string }>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "保存できませんでした。");
  return result;
}

function ExpenseForm({ group, expense, onSaved, onCancel }: { group: Group; expense?: Expense; onSaved: () => Promise<void>; onCancel?: () => void }) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [payerId, setPayerId] = useState(expense?.payerId ?? group.members[0]?.id ?? "");
  const [participants, setParticipants] = useState<string[]>(expense?.participantIds ?? group.members.map((member) => member.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await send(`/api/groups/${group.id}/expenses${expense ? `/${expense.id}` : ""}`, expense ? "PATCH" : "POST", { title, amount: Number(amount), payerId, participantIds: participants });
      await onSaved();
      if (!expense) { setTitle(""); setAmount(""); }
      onCancel?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存できませんでした。"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="expense-form">
    <div className="two-fields"><label className="field"><span>内容</span><input required maxLength={80} placeholder="例：夕食" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>金額</span><div className="money-input"><span>¥</span><input required type="number" min="1" max="1000000000" step="1" inputMode="numeric" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div></label></div>
    <div className="two-fields"><div className="field"><span>支払った人</span><Select value={payerId} onValueChange={setPayerId}><SelectTrigger className="select-trigger"><SelectValue placeholder="選択してください" /></SelectTrigger><SelectContent>{group.members.map((member) => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select></div><fieldset className="field"><legend>割り勘する人</legend><div className="member-options">{group.members.map((member) => <label key={member.id} className="member-option"><Checkbox checked={participants.includes(member.id)} onCheckedChange={(checked) => setParticipants((current) => checked ? [...current, member.id] : current.filter((id) => id !== member.id))} />{member.name}</label>)}</div></fieldset></div>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="submit" disabled={busy} className="primary-button">{busy ? "保存中…" : expense ? "変更を保存" : "支払いを追加"}</Button>{onCancel && <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>}</div>
  </form>;
}

export default function GroupClient({ id }: { id: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newMember, setNewMember] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const refresh = useCallback(async () => {
    try { const next = await send<Group>(`/api/groups/${id}`, "GET"); setGroup(next); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "読み込めませんでした。"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void refresh(); const focus = () => void refresh(); window.addEventListener("focus", focus); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000); return () => { window.removeEventListener("focus", focus); window.clearInterval(timer); }; }, [refresh]);
  const settlement = useMemo(() => group ? calculateSettlement(group.members, group.expenses) : null, [group]);
  const nameOf = (memberId: string) => group?.members.find((member) => member.id === memberId)?.name ?? "不明";
  async function addMember(event: React.FormEvent) {
    event.preventDefault(); setNotice(""); setAddingMember(true);
    try { await send(`/api/groups/${id}`, "POST", { type: "member", name: newMember }); setNewMember(""); await refresh(); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : "追加できませんでした。"); }
    finally { setAddingMember(false); }
  }
  async function removeExpense(expenseId: string) {
    try { await send(`/api/groups/${id}/expenses/${expenseId}`, "DELETE"); setEditing(null); await refresh(); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : "削除できませんでした。"); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopyDone(true); window.setTimeout(() => setCopyDone(false), 2500); }
    catch { setNotice("URLをコピーできませんでした。ブラウザのアドレス欄からコピーしてください。"); }
  }
  if (loading) return <main className="site-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">÷</span> 割り勘ノート</a></header><p className="loading-message">読み込み中…</p></main>;
  if (!group) return <main className="site-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">÷</span> 割り勘ノート</a></header><div className="error-panel"><h1>グループを開けませんでした</h1><p>{error}</p><Button onClick={() => void refresh()} className="primary-button">再読み込み</Button></div></main>;
  return <main className="site-shell">
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">÷</span> 割り勘ノート</a><Button variant="outline" onClick={copyLink} className="share-button">{copyDone ? <Check size={16} /> : <Copy size={16} />}{copyDone ? "コピーしました" : "共有URLをコピー"}</Button></header>
    <div className="group-heading"><div><p className="eyebrow">SHARED GROUP</p><h1>{group.title}</h1><p><Users size={16} /> {group.members.length}人で精算</p></div></div>
    {notice && <div className="notice" role="alert">{notice}<button onClick={() => setNotice("")} aria-label="閉じる">×</button></div>}
    <div className="group-grid"><div className="group-main">
      <section className="panel" aria-labelledby="add-expense"><div className="section-title"><span className="icon-tile"><Plus size={22} /></span><div><p className="eyebrow">NEW EXPENSE</p><h2 id="add-expense">支払いを記録</h2></div></div><ExpenseForm group={group} onSaved={refresh} /></section>
      <section className="panel" aria-labelledby="expense-list"><div className="section-title"><span className="icon-tile pale"><ReceiptText size={21} /></span><div><p className="eyebrow">EXPENSES</p><h2 id="expense-list">支払い一覧 <em>{group.expenses.length}</em></h2></div></div>{group.expenses.length === 0 ? <p className="empty-text">まだ支払いはありません。最初の支払いを追加してください。</p> : <div className="expense-list">{group.expenses.map((expense) => <div key={expense.id} className="expense-row"><div className="expense-row-main"><div><strong>{expense.title}</strong><p>{nameOf(expense.payerId)}が支払い · {expense.participantIds.length}人で割り勘</p></div><b>{yen(expense.amount)}</b></div>{editing === expense.id ? <div className="edit-area"><ExpenseForm key={expense.id} group={group} expense={expense} onSaved={refresh} onCancel={() => setEditing(null)} /></div> : <div className="row-actions"><Button size="sm" variant="ghost" onClick={() => setEditing(expense.id)}><Pencil size={15} />編集</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="danger-text"><Trash2 size={15} />削除</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>この支払いを削除しますか？</AlertDialogTitle><AlertDialogDescription>「{expense.title}」を削除すると、精算結果も更新されます。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void removeExpense(expense.id)}>削除する</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>}</div>)}</div>}</section>
    </div><aside className="group-side"><section className="settlement-panel" aria-labelledby="settlement"><p className="eyebrow">SETTLEMENT</p><h2 id="settlement">精算結果</h2><div className="total-line"><span>支払い総額</span><strong>{yen(settlement?.total ?? 0)}</strong></div>{settlement?.transfers.length ? <div className="transfer-list">{settlement.transfers.map((transfer, index) => <div key={`${transfer.from}-${transfer.to}-${index}`} className="transfer"><div><span>{nameOf(transfer.from)}</span><ArrowRight size={17} /><span>{nameOf(transfer.to)}</span></div><strong>{yen(transfer.amount)}</strong></div>)}</div> : <p className="settlement-empty">{group.expenses.length ? "精算する金額はありません。" : "支払いを追加すると、送金先と金額が表示されます。"}</p>}<p className="settlement-note">1円単位で端数を調整して計算しています。</p></section><section className="panel members-panel" aria-labelledby="member-list"><div className="section-title"><span className="icon-tile pale"><Users size={20} /></span><div><p className="eyebrow">MEMBERS</p><h2 id="member-list">参加者</h2></div></div><div className="member-list">{group.members.map((member, index) => <span key={member.id}><i>{index + 1}</i>{member.name}</span>)}</div><form onSubmit={addMember} className="add-member"><label className="field"><span>参加者を追加</span><input required maxLength={40} value={newMember} onChange={(event) => setNewMember(event.target.value)} placeholder="名前を入力" /></label><Button type="submit" size="sm" variant="outline" disabled={addingMember}><Plus size={16} />追加</Button></form></section></aside></div>
  </main>;
}
