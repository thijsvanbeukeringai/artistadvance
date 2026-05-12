"use client";

import { useState, useTransition } from "react";
import {
  addPaymentMilestoneAction,
  updatePaymentMilestoneAction,
  removePaymentMilestoneAction,
} from "@/lib/actions";
import type { BookingPaymentMilestone, PaymentMilestoneStatus } from "@/lib/types";
import { todayAmsterdamIso } from "@/lib/datetime";

const STATUS_LABELS: Record<PaymentMilestoneStatus, string> = {
  pending: "Pending",
  invoiced: "Factuur verstuurd",
  paid: "Betaald",
  overdue: "Te laat",
};

const STATUS_TONE: Record<PaymentMilestoneStatus, string> = {
  pending: "bg-ink-100 text-ink-700",
  invoiced: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
};

export default function BookingPaymentMilestones({
  bookingId,
  milestones,
  totalFee,
}: {
  bookingId: string;
  milestones: BookingPaymentMilestone[];
  totalFee: number | null;
}) {
  const [adding, setAdding] = useState(false);
  const today = todayAmsterdamIso();

  const paid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + (m.amount ?? 0), 0);
  const outstanding = milestones.filter((m) => m.status !== "paid").reduce((s, m) => s + (m.amount ?? 0), 0);
  const overdue = milestones.filter((m) => m.status !== "paid" && m.due_date && m.due_date < today).reduce((s, m) => s + (m.amount ?? 0), 0);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Betaalmilestones</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Deposit, final, eventuele tussenfase. Verschijnt in financieel dashboard.</p>
        </div>
        {totalFee && (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-700 font-semibold tabular-nums">€ {paid.toLocaleString("nl-NL")} betaald</span>
            <span className="text-amber-800 font-semibold tabular-nums">€ {outstanding.toLocaleString("nl-NL")} open</span>
            {overdue > 0 && <span className="text-red-700 font-bold tabular-nums">€ {overdue.toLocaleString("nl-NL")} te laat</span>}
          </div>
        )}
      </header>
      <div className="p-5 space-y-3">
        {milestones.length === 0 && !adding && (
          <div className="text-xs text-ink-500 italic">Nog geen milestones. Voorbeeld: deposit 50% bij signing, final 50% op show day.</div>
        )}

        {milestones.map((m) => <MilestoneRow key={m.id} milestone={m} bookingId={bookingId} />)}

        {adding ? (
          <AddForm bookingId={bookingId} totalFee={totalFee} onClose={() => setAdding(false)} />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              + Milestone toevoegen
            </button>
            {milestones.length === 0 && totalFee && totalFee > 0 && (
              <SeedDefaultsButton bookingId={bookingId} totalFee={totalFee} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function MilestoneRow({ milestone, bookingId }: { milestone: BookingPaymentMilestone; bookingId: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [label, setLabel] = useState(milestone.label);
  const [amount, setAmount] = useState(milestone.amount?.toString() ?? "");
  const [due, setDue] = useState(milestone.due_date ?? "");
  const [status, setStatus] = useState<PaymentMilestoneStatus>(milestone.status);
  const [paidDate, setPaidDate] = useState(milestone.paid_date ?? "");
  const [notes, setNotes] = useState(milestone.notes ?? "");

  function save() {
    start(async () => {
      await updatePaymentMilestoneAction(milestone.id, bookingId, {
        label: label.trim(),
        amount: amount.trim() ? Number(amount) : null,
        due_date: due || null,
        status,
        paid_date: paidDate || null,
        notes: notes.trim() || null,
      });
      setEditing(false);
    });
  }

  function quickStatus(next: PaymentMilestoneStatus) {
    start(async () => {
      await updatePaymentMilestoneAction(milestone.id, bookingId, {
        status: next,
        paid_date: next === "paid" ? todayAmsterdamIso() : null,
      });
    });
  }

  function remove() {
    if (!confirm(`Milestone "${milestone.label}" verwijderen?`)) return;
    start(async () => {
      await removePaymentMilestoneAction(milestone.id, bookingId);
    });
  }

  if (editing) {
    return (
      <div className="bg-white border border-ink-200 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className={inputCls} />
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Bedrag EUR" className={inputCls} />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          <select value={status} onChange={(e) => setStatus(e.target.value as PaymentMilestoneStatus)} className={inputCls}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {status === "paid" && (
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} placeholder="Datum betaald" className={inputCls} />
          )}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notities" className={`${inputCls} min-h-[50px]`} />
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
          <button type="button" onClick={save} disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Opslaan"}</button>
        </div>
      </div>
    );
  }

  const today = todayAmsterdamIso();
  const isOverdue = milestone.status !== "paid" && milestone.due_date && milestone.due_date < today;

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink-900">{milestone.label}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isOverdue ? STATUS_TONE.overdue : STATUS_TONE[milestone.status]}`}>
            {isOverdue ? "Te laat" : STATUS_LABELS[milestone.status]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-ink-600 mt-1 flex-wrap">
          {milestone.amount != null && <span className="font-semibold text-ink-900 tabular-nums">€ {milestone.amount.toLocaleString("nl-NL")}</span>}
          {milestone.due_date && <span className="tabular-nums">due {milestone.due_date}</span>}
          {milestone.paid_date && <span className="text-emerald-700 tabular-nums">betaald {milestone.paid_date}</span>}
        </div>
        {milestone.notes && <div className="text-[11px] text-ink-500 mt-1 italic">{milestone.notes}</div>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {milestone.status !== "paid" && (
          <button type="button" onClick={() => quickStatus("paid")} disabled={pending} className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded">
            Markeer betaald
          </button>
        )}
        {milestone.status === "pending" && (
          <button type="button" onClick={() => quickStatus("invoiced")} disabled={pending} className="text-[11px] font-semibold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded">
            Factuur verstuurd
          </button>
        )}
        <button type="button" onClick={() => setEditing(true)} disabled={pending} className="p-1.5 rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </button>
        <button type="button" onClick={remove} disabled={pending} className="p-1.5 rounded text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
        </button>
      </div>
    </div>
  );
}

function AddForm({ bookingId, totalFee, onClose }: { bookingId: string; totalFee: number | null; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError("Label is verplicht."); return; }
    setError(null);
    start(async () => {
      const result = await addPaymentMilestoneAction(bookingId, {
        label: label.trim(),
        amount: amount.trim() ? Number(amount) : null,
        due_date: due || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="bg-brand-50 border-2 border-dashed border-brand-300 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bv. Deposit 50%" required className={inputCls} />
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={totalFee ? `${(totalFee / 2).toFixed(2)} (50%)` : "EUR"} className={inputCls} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
      </div>
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Toevoegen"}</button>
      </div>
    </form>
  );
}

function SeedDefaultsButton({ bookingId, totalFee }: { bookingId: string; totalFee: number }) {
  const [pending, start] = useTransition();
  function seed() {
    start(async () => {
      const half = Math.round((totalFee / 2) * 100) / 100;
      await addPaymentMilestoneAction(bookingId, { label: "Deposit 50%", amount: half, due_date: null });
      await addPaymentMilestoneAction(bookingId, { label: "Final 50%", amount: half, due_date: null });
    });
  }
  return (
    <button type="button" onClick={seed} disabled={pending} className="text-xs text-ink-500 hover:underline">
      {pending ? "..." : "of: 50/50 standaard genereren"}
    </button>
  );
}

const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
