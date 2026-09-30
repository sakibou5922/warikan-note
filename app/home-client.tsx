"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { splitAmount } from "@/lib/ledger";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function Home() {
  const router = useRouter();
  const [amount, setAmount] = useState("12000");
  const [count, setCount] = useState("3");
  const [title, setTitle] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shares = useMemo(() => splitAmount(Number(amount), Number(count)), [amount, count]);
  const lower = shares.length ? Math.min(...shares) : 0;
  const higher = shares.filter((share) => share > lower).length;

  async function createGroup(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, names: names.split(/[、,\n]/).map((name) => name.trim()).filter(Boolean) }) });
      const result = await response.json() as { id: string; error?: string };
      if (!response.ok) throw new Error(result.error || "グループを作れませんでした。");
      router.push(`/g/${result.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "グループを作れませんでした。"); }
    finally { setBusy(false); }
  }

  return <main className="site-shell">
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">÷</span> 割り勘ノート</a><span className="topbar-note">会計を、すっきり。</span></header>
    <div className="home-intro"><p className="eyebrow">SPLIT THE BILL</p><h1>みんなの会計を<br /><span>迷わず割り勘。</span></h1><p>1回の会計も、いくつもの立替も。金額を入れれば、支払い方までわかります。</p></div>
    <div className="home-grid">
      <section className="panel quick-panel" aria-labelledby="quick-heading"><div className="panel-heading"><span className="icon-tile"><Calculator size={22} /></span><div><p className="eyebrow">QUICK CALC</p><h2 id="quick-heading">今すぐ割り勘</h2></div></div><div className="field-grid"><label className="field"><span>合計金額</span><div className="money-input"><span>¥</span><input type="number" min="0" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} /></div></label><label className="field"><span>人数</span><div className="money-input"><input type="number" min="1" max="100" step="1" inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} /><span>人</span></div></label></div><div className="quick-result" aria-live="polite"><span>1人あたり</span><strong>{shares.length ? yen(lower) : "—"}</strong>{higher > 0 && <p>端数分として {higher}人は {yen(lower + 1)}</p>}{!shares.length && <p>金額と人数を入力してください</p>}</div></section>
      <section className="panel group-create" aria-labelledby="group-heading"><div className="panel-heading"><span className="icon-tile blue"><Users size={22} /></span><div><p className="eyebrow">SHARED SETTLEMENT</p><h2 id="group-heading">立替をまとめて精算</h2></div></div><p className="panel-description">参加者と支払いを記録して、誰が誰にいくら払うかを計算します。</p><form onSubmit={createGroup} className="form-stack"><label className="field"><span>グループ名</span><input required maxLength={80} placeholder="例：週末の旅行" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>参加者の名前</span><textarea required rows={2} placeholder="例：田中、佐藤、鈴木" value={names} onChange={(event) => setNames(event.target.value)} /><small>2人以上。名前は「、」または「,」で区切ってください。</small></label>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy} className="primary-button">{busy ? "作成中…" : "グループを作る"}<ArrowRight size={18} /></Button></form></section>
    </div>
  </main>;
}
