"use client";

import { useState, useTransition } from "react";
import {
  addBookingTaskAction,
  updateBookingTaskAction,
  removeBookingTaskAction,
} from "@/lib/actions";
import type { BookingTask } from "@/lib/types";

export default function BookingTasks({ bookingId, tasks }: { bookingId: string; tasks: BookingTask[] }) {
  const [adding, setAdding] = useState(false);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Taken</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Wat moet er gebeuren voordat deze deal closed?</p>
        </div>
        <span className="text-[11px] text-ink-500 tabular-nums">{open.length} open · {done.length} klaar</span>
      </header>
      <div className="p-5 space-y-2">
        {open.map((t) => <TaskRow key={t.id} task={t} bookingId={bookingId} />)}
        {done.length > 0 && (
          <details className="pt-2 border-t border-ink-200">
            <summary className="text-xs text-ink-500 cursor-pointer hover:text-ink-900">Klaar ({done.length})</summary>
            <div className="space-y-2 mt-2">
              {done.map((t) => <TaskRow key={t.id} task={t} bookingId={bookingId} />)}
            </div>
          </details>
        )}
        {adding ? (
          <AddTask bookingId={bookingId} onClose={() => setAdding(false)} />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="text-xs font-semibold text-brand-600 hover:underline">
            + Taak toevoegen
          </button>
        )}
      </div>
    </section>
  );
}

function TaskRow({ task, bookingId }: { task: BookingTask; bookingId: string }) {
  const [pending, start] = useTransition();
  function toggle() {
    start(async () => {
      await updateBookingTaskAction(task.id, bookingId, { done: !task.done });
    });
  }
  function remove() {
    if (!confirm("Verwijder taak?")) return;
    start(async () => {
      await removeBookingTaskAction(task.id, bookingId);
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !task.done && task.due_date && task.due_date < today;
  return (
    <div className="flex items-center justify-between gap-3 group">
      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
        <input type="checkbox" checked={task.done} onChange={toggle} disabled={pending} />
        <span className={`text-sm ${task.done ? "text-ink-400 line-through" : "text-ink-900"}`}>{task.label}</span>
        {task.due_date && (
          <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded ${overdue ? "bg-red-100 text-red-800 font-bold" : "bg-ink-100 text-ink-500"}`}>
            {task.due_date}
          </span>
        )}
      </label>
      <button type="button" onClick={remove} disabled={pending} className="p-1 rounded text-ink-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 disabled:opacity-50">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18 M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function AddTask({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [due, setDue] = useState("");
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    start(async () => {
      await addBookingTaskAction(bookingId, { label: label.trim(), due_date: due || null });
      setLabel("");
      setDue("");
      onClose();
    });
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bv. contract sturen" className="flex-1 px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
      <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md disabled:opacity-50">{pending ? "..." : "Toevoegen"}</button>
      <button type="button" onClick={onClose} disabled={pending} className="text-xs text-ink-500 hover:bg-ink-100 px-2 py-1 rounded">✕</button>
    </form>
  );
}
