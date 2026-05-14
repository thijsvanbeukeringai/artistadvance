import Link from "next/link";
import type { ReadinessResult, BucketSignal, ReadinessBucket } from "@/lib/readiness";
import type { SectionType } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/data";

const fillFor = (tone: BucketSignal["tone"]) =>
  tone === "ok" ? "bg-emerald-500" : tone === "partial" ? "bg-amber-400" : "bg-ink-200";

const scoreRingColor = (score: number) =>
  score >= 90 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#dc2626";

const urgencyClass: Record<string, string> = {
  ok: "bg-ink-100 text-ink-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-ink-50 text-ink-400",
};

const SECTIONS_BY_BUCKET: Record<ReadinessBucket, SectionType[]> = {
  tech: ["dj_gear", "monitors", "audio", "light", "video", "lasers", "sfx_pyro", "stage", "ethernet", "communication", "power", "backline"],
  logistics: ["logistics"],
  travel: ["travel", "hotel"],
  hospitality: ["hospitality"],
  contacts: ["contacts"],
  visa: ["visa"],
};

type SubAction = {
  label: string;
  hint?: string;
  href?: string;
  tone: "bad" | "warn" | "ok";
};

type ActionItem = {
  label: string;
  detail: string;
  tone: "bad" | "warn" | "ok";
  href?: string;
  subItems?: SubAction[];
};

function buildActionQueue(readiness: ReadinessResult, portalToken?: string): ActionItem[] {
  const items: ActionItem[] = [];
  const portalBase = portalToken ? `/festival/${portalToken}` : null;
  const festivalBase = portalToken ? `/festival/${portalToken}` : null;
  const sectionsByType = new Map(readiness.fullSections.map((s) => [s.type, s]));

  // Disputed riders eerst
  for (const r of readiness.riders.items) {
    if (r.status === "disputed") {
      items.push({
        label: `${r.type === "technical" ? "Tech" : r.type === "hospitality" ? "Hospitality" : "SFX/Pyro"} rider disputed`,
        detail: "Bespreek met festival of accepteer alternatief.",
        tone: "bad",
        href: "#riders",
      });
    }
  }

  // Disputed tech items
  if (readiness.techItems.disputed > 0) {
    items.push({
      label: `${readiness.techItems.disputed} tech item${readiness.techItems.disputed > 1 ? "s" : ""} disputed`,
      detail: "Festival heeft een item geweigerd. Open de tech items lijst.",
      tone: "bad",
      href: "#tech-items",
    });
  }

  // Tech: alternative offered / not_available wachten op besluit
  if (readiness.techItems.alternative_offered + readiness.techItems.not_available > 0) {
    items.push({
      label: `${readiness.techItems.alternative_offered + readiness.techItems.not_available} tech item${(readiness.techItems.alternative_offered + readiness.techItems.not_available) > 1 ? "s" : ""} wachten op management-besluit`,
      detail: "Festival biedt alternatief of zegt niet leverbaar - accepteer of disputeer.",
      tone: "warn",
      href: "#tech-items",
    });
  }

  // Buckets <100%: toon de ontbrekende sub-secties expliciet
  for (const b of readiness.buckets) {
    if (b.percent >= 100) continue;
    const isTech = b.bucket === "tech";
    const subs = (SECTIONS_BY_BUCKET[b.bucket] ?? [])
      .map((t) => sectionsByType.get(t))
      .filter((s): s is NonNullable<typeof s> => {
        if (!s || s.percent >= 100) return false;
        // Tech-secties zonder requirements verbergen — niets om op te bevestigen.
        if (isTech && (s.itemCount ?? 0) === 0) return false;
        return true;
      });

    // Geen onbevestigde subs → geen action item nodig
    if (subs.length === 0) continue;
    const isFestivalSide = isTech;

    const subItems: SubAction[] = subs.map((s) => ({
      label: SECTION_LABELS[s.type] ?? s.type,
      hint: s.percent > 0
        ? (isFestivalSide ? `${s.percent}% — festival nog niet alle items bevestigd` : `${s.percent}% klaar`)
        : (isFestivalSide ? "festival heeft nog niets bevestigd" : "nog niet ingevuld"),
      href: portalBase ?? undefined,
      tone: s.tone === "empty" ? "bad" : "warn",
    }));

    items.push({
      label: isFestivalSide
        ? (b.percent === 0
            ? `${b.label} — festival moet PLEASE CONFIRM nog invullen`
            : `${b.label} op ${b.percent}% — wachten op festival`)
        : (b.percent === 0
            ? `${b.label} sectie nog niet gestart`
            : `${b.label} op ${b.percent}%`),
      detail: isFestivalSide
        ? `${subs.length} sub-sectie${subs.length === 1 ? "" : "s"} wachten op confirms van het festival via de PLEASE CONFIRM lijst. Stuur de festival-portal link en herinner ze er aan.`
        : (subs.length > 1
            ? `${subs.length} sub-sectie${subs.length === 1 ? "" : "s"} open. Klik per stuk om de specs in te vullen.`
            : "Open de sectie om de basisgegevens in te vullen."),
      tone: b.percent === 0 ? "bad" : "warn",
      // Als er maar één sub-sectie open is, link direct daar naartoe; anders gebruik subItems.
      href: subItems.length === 1 ? subItems[0].href : undefined,
      subItems: subItems.length > 1 ? subItems : undefined,
    });
  }

  // Pending riders (per stuk)
  const pendingRiders = readiness.riders.items.filter((r) => r.status === "pending" || r.status === "sent_to_festival");
  if (pendingRiders.length > 0) {
    items.push({
      label: `${pendingRiders.length} rider${pendingRiders.length > 1 ? "s" : ""} bij festival`,
      detail: "Wachten op terugkeer met handtekening.",
      tone: "warn",
      href: festivalBase ?? "#riders",
      subItems: pendingRiders.map((r): SubAction => ({
        label: r.type === "technical" ? "Technische rider" : r.type === "hospitality" ? "Hospitality rider" : "SFX/Pyro rider",
        hint: r.status === "sent_to_festival" ? "verstuurd, wachten op signing" : "nog niet verstuurd",
        href: festivalBase ?? undefined,
        tone: "warn",
      })),
    });
  }

  if (items.length === 0) {
    items.push({
      label: "Alles klaar",
      detail: "Geen openstaande acties - show is ready to go.",
      tone: "ok",
    });
  }

  return items;
}

export default function ReadinessPanel({
  readiness,
  showDate,
  showTime,
  portalToken,
}: {
  readiness: ReadinessResult;
  showDate: string;
  showTime: string;
  portalToken?: string;
}) {
  const actions = buildActionQueue(readiness, portalToken);
  const primaryAction = actions[0];
  const restActions = actions.slice(1, 6);

  const sectionsCompleted = readiness.buckets.filter((b) => b.percent >= 100).length;
  const techConfirmed = readiness.techItems.confirmed + readiness.techItems.accepted;
  const ridersOk = readiness.riders.accepted + readiness.riders.signed;

  return (
    <section
      aria-label="Show readiness overzicht"
      className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden"
    >
      {/* HERO: score + volgende stap + 3 mini stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-ink-200">
        <div className="p-6 flex flex-col items-center justify-center bg-ink-50/40">
          <ScoreRing score={readiness.score} />
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${urgencyClass[readiness.urgency.tone]}`}>
            {readiness.urgency.label} · {readiness.urgency.level}
          </div>
          <div className="text-[11px] text-ink-400 mt-1 tabular-nums">{showDate} · {showTime}</div>
        </div>

        <div className="p-6 space-y-5">
          {/* Volgende stap */}
          <div className={`rounded-xl p-4 ${
            primaryAction.tone === "bad"
              ? "bg-red-50 border border-red-100"
              : primaryAction.tone === "warn"
              ? "bg-amber-50 border border-amber-100"
              : "bg-emerald-50 border border-emerald-100"
          }`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${
                  primaryAction.tone === "bad" ? "text-red-700" : primaryAction.tone === "warn" ? "text-amber-700" : "text-emerald-700"
                }`}>
                  Volgende stap
                </div>
                <div className={`text-lg font-extrabold mt-1 ${
                  primaryAction.tone === "bad" ? "text-red-900" : primaryAction.tone === "warn" ? "text-amber-900" : "text-emerald-900"
                }`}>
                  {primaryAction.label}
                </div>
                <p className={`text-sm mt-1 ${
                  primaryAction.tone === "bad" ? "text-red-700" : primaryAction.tone === "warn" ? "text-amber-700" : "text-emerald-700"
                }`}>
                  {primaryAction.detail}
                </p>
              </div>
              {primaryAction.href && (
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition whitespace-nowrap"
                >
                  Open →
                </Link>
              )}
            </div>
            {primaryAction.subItems && primaryAction.subItems.length > 0 && (
              <ul className={`mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-3 border-t ${
                primaryAction.tone === "bad" ? "border-red-200" : "border-amber-200"
              }`}>
                {primaryAction.subItems.map((sub, i) => (
                  <SubActionRow key={i} sub={sub} parentTone={primaryAction.tone} />
                ))}
              </ul>
            )}
          </div>

          {/* 3 mini stats */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Secties klaar" value={`${sectionsCompleted}/${readiness.buckets.length}`} tone={sectionsCompleted === readiness.buckets.length ? "ok" : "warn"} />
            {readiness.techItems.total > 0 && (
              <MiniStat
                label="Tech items"
                value={`${techConfirmed}/${readiness.techItems.total}`}
                tone={readiness.techItems.disputed > 0 ? "bad" : techConfirmed === readiness.techItems.total ? "ok" : "warn"}
              />
            )}
            {readiness.riders.total > 0 && (
              <MiniStat
                label="Riders"
                value={`${ridersOk}/${readiness.riders.total}`}
                tone={readiness.riders.disputed > 0 ? "bad" : ridersOk === readiness.riders.total ? "ok" : "warn"}
              />
            )}
          </div>
        </div>
      </div>

      {/* Voortgang per categorie */}
      <div className="px-6 py-5 border-t border-ink-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900">Voortgang per categorie</h3>
          <details className="text-xs">
            <summary className="cursor-pointer text-ink-500 hover:text-ink-900">Toon alle {readiness.fullSections.length} sub-secties</summary>
            <div className="absolute right-6 mt-2 z-10 bg-white border border-ink-200 rounded-xl shadow-xl p-4 min-w-[280px]">
              <ul className="grid grid-cols-2 gap-2">
                {readiness.fullSections.map((s) => (
                  <li key={s.type} className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${fillFor(s.tone)} flex-shrink-0`} />
                    <span className="text-ink-700 truncate flex-1">{SECTION_LABELS[s.type] ?? s.type}</span>
                    <span className="text-ink-500 tabular-nums">{s.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {readiness.buckets.map((b) => (
            <div key={b.bucket} className="rounded-lg border border-ink-200 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-ink-900 truncate">{b.label}</span>
                <span className="text-xs font-bold tabular-nums text-ink-900">{b.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div className={`h-full transition-all ${fillFor(b.tone)}`} style={{ width: `${b.percent}%` }} />
              </div>
              {b.detail && (
                <div className="text-[10px] text-ink-400 mt-1 tabular-nums">{b.detail}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actiequeue */}
      {restActions.length > 0 && (
        <div className="px-6 py-5 border-t border-ink-200">
          <h3 className="text-sm font-bold text-ink-900 mb-3">Actiequeue</h3>
          <ul className="space-y-3">
            {restActions.map((a, i) => (
              <li
                key={i}
                className={`rounded-lg overflow-hidden ${
                  a.tone === "bad" ? "bg-red-50" : a.tone === "warn" ? "bg-amber-50" : "bg-emerald-50"
                }`}
              >
                <div className="flex items-start gap-3 px-3 py-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    a.tone === "bad" ? "bg-red-500" : a.tone === "warn" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${
                      a.tone === "bad" ? "text-red-900" : a.tone === "warn" ? "text-amber-900" : "text-emerald-900"
                    }`}>
                      {a.label}
                    </div>
                    <div className={`text-xs ${
                      a.tone === "bad" ? "text-red-700" : a.tone === "warn" ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {a.detail}
                    </div>
                  </div>
                  {a.href && (
                    <Link href={a.href} className="text-xs font-semibold text-ink-700 hover:text-ink-900 hover:underline whitespace-nowrap">
                      Open →
                    </Link>
                  )}
                </div>
                {a.subItems && a.subItems.length > 0 && (
                  <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-1 px-3 pb-3 pt-1 border-t ${
                    a.tone === "bad" ? "border-red-200/60" : "border-amber-200/60"
                  }`}>
                    {a.subItems.map((sub, j) => (
                      <SubActionRow key={j} sub={sub} parentTone={a.tone} />
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SubActionRow({ sub, parentTone }: { sub: SubAction; parentTone: "bad" | "warn" | "ok" }) {
  const dotClass =
    sub.tone === "bad" ? "bg-red-500" : sub.tone === "warn" ? "bg-amber-500" : "bg-emerald-500";
  const labelClass =
    parentTone === "bad" ? "text-red-900" : parentTone === "warn" ? "text-amber-900" : "text-emerald-900";
  const hintClass =
    parentTone === "bad" ? "text-red-700" : parentTone === "warn" ? "text-amber-700" : "text-emerald-700";
  const inner = (
    <>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
      <span className={`text-xs font-semibold ${labelClass} flex-1 truncate`}>{sub.label}</span>
      {sub.hint && <span className={`text-[10px] tabular-nums ${hintClass}`}>{sub.hint}</span>}
      {sub.href && (
        <span className={`text-[10px] font-bold ${labelClass} opacity-70`}>Open →</span>
      )}
    </>
  );
  if (sub.href) {
    return (
      <li>
        <Link href={sub.href} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/60 transition">
          {inner}
        </Link>
      </li>
    );
  }
  return <li className="flex items-center gap-2 px-2 py-1.5">{inner}</li>;
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "bad" }) {
  const cls =
    tone === "ok" ? "border-emerald-200 bg-emerald-50" :
    tone === "warn" ? "border-amber-200 bg-amber-50" :
    "border-red-200 bg-red-50";
  const textCls =
    tone === "ok" ? "text-emerald-900" :
    tone === "warn" ? "text-amber-900" :
    "text-red-900";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${cls}`}>
      <div className={`text-[10px] uppercase tracking-wider font-bold opacity-80 ${textCls}`}>{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${textCls}`}>{value}</div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const stroke = scoreRingColor(score);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} stroke="#e3e6eb" strokeWidth="11" fill="none" />
      <circle
        cx="70"
        cy="70"
        r={r}
        stroke={stroke}
        strokeWidth="11"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 250ms ease" }}
      />
      <text x="70" y="68" textAnchor="middle" fontSize="34" fontWeight={800} fill="#0f1115" className="tabular-nums">
        {score}
      </text>
      <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#5b6370" fontWeight={600}>readiness</text>
    </svg>
  );
}
