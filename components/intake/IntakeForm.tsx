"use client";

import { useState, useTransition } from "react";
import { submitIntakeAction } from "@/lib/actions";

export default function IntakeForm({ slug, artistName }: { slug: string; artistName: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await submitIntakeAction(slug, fd);
      if (!r.ok) {
        setErr(r.error ?? "Verzenden mislukt");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <section className="bg-white border border-emerald-200 rounded-2xl shadow-card p-8 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto grid place-items-center text-2xl font-bold mb-3">✓</div>
        <h2 className="text-xl font-bold text-ink-900">Aanvraag verzonden</h2>
        <p className="text-sm text-ink-500 mt-2">{artistName} ontvangt je aanvraag en bevestigt zelf.</p>
      </section>
    );
  }

  const inputCls = "w-full bg-white border border-ink-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-ink-700 mb-1";

  return (
    <form onSubmit={onSubmit} className="bg-white border border-ink-200 rounded-2xl shadow-card p-6 space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-ink-900 mb-2">Show details</legend>
        <div>
          <label className={labelCls}>Festival / venue *</label>
          <input name="festival_name" required className={inputCls} placeholder="Bv. Tomorrowland" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Datum *</label>
            <input type="date" name="show_date" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Set-tijd</label>
            <input type="time" name="show_time" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Stage</label>
            <input name="stage_name" className={inputCls} placeholder="Main Stage" />
          </div>
          <div>
            <label className={labelCls}>Set duur (min)</label>
            <input type="number" name="set_duration_minutes" className={inputCls} placeholder="60" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Stad</label>
            <input name="venue_city" className={inputCls} placeholder="Boom" />
          </div>
          <div>
            <label className={labelCls}>Land</label>
            <input name="venue_country" className={inputCls} placeholder="BE" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Show-type</label>
          <select name="show_type" defaultValue="club" className={inputCls}>
            <option value="festival">Festival</option>
            <option value="club">Club</option>
            <option value="full_production">Full Production</option>
            <option value="ldjv">LDJV</option>
            <option value="venue">Venue</option>
            <option value="corporate">Corporate</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Fee aanbod (EUR)</label>
          <input type="number" name="fee" step="0.01" className={inputCls} placeholder="5000" />
        </div>
      </fieldset>

      <fieldset className="space-y-4 pt-4 border-t border-ink-200">
        <legend className="text-sm font-bold text-ink-900 mb-2">Wie ben jij?</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Naam *</label>
            <input name="promoter_name" required className={inputCls} placeholder="Voor- en achternaam" />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" name="promoter_email" required className={inputCls} placeholder="jij@promoter.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Telefoon</label>
            <input name="promoter_phone" className={inputCls} placeholder="+31 6 ..." />
          </div>
          <div>
            <label className={labelCls}>Bedrijf</label>
            <input name="promoter_company" className={inputCls} placeholder="Bv. Awakenings BV" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notitie</label>
          <textarea name="notes" rows={3} className={inputCls} placeholder="Bv. specifieke wensen, andere artists op de line-up, etc." />
        </div>
      </fieldset>

      {err && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-5 py-3 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition disabled:opacity-50"
      >
        {pending ? "Verzenden..." : "Verstuur aanvraag"}
      </button>
    </form>
  );
}
