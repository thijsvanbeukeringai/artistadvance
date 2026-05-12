// Readiness layer - pure utility, draait in RSC.
// Spec v2: 12 tech sub-secties + 6 niet-tech secties = 18.
// In lijsten / overzichten groeperen we tot 6 buckets; detail toont alles.

import type {
  Advancing,
  AdvancingSection,
  Booking,
  RiderType,
  SectionType,
  SignedRider,
  RiderStatus,
} from "./types";
import type { Snapshot } from "./snapshot";

export type ReadinessBucket = "tech" | "logistics" | "travel" | "hospitality" | "contacts" | "visa";

const BUCKET_LABELS: Record<ReadinessBucket, string> = {
  tech: "Tech",
  logistics: "Logist.",
  travel: "Travel",
  hospitality: "Hosp.",
  contacts: "Contacts",
  visa: "Visa",
};

function bucketFor(type: SectionType): ReadinessBucket {
  switch (type) {
    case "dj_gear":
    case "monitors":
    case "audio":
    case "light":
    case "video":
    case "lasers":
    case "sfx_pyro":
    case "stage":
    case "ethernet":
    case "communication":
    case "power":
    case "backline":
      return "tech";
    case "logistics":
      return "logistics";
    case "travel":
    case "hotel":
      return "travel";
    case "hospitality":
      return "hospitality";
    case "contacts":
      return "contacts";
    case "visa":
      return "visa";
  }
}

const BUCKET_WEIGHTS: Record<ReadinessBucket, number> = {
  tech: 40,
  logistics: 15,
  travel: 15,
  hospitality: 10,
  contacts: 10,
  visa: 10,
};

export type SectionTone = "ok" | "partial" | "empty";
export type RiderTone = "ok" | "warn" | "bad";
export type UrgencyLevel = "calm" | "soon" | "urgent" | "critical" | "past";

export interface BucketSignal {
  bucket: ReadinessBucket;
  label: string;
  percent: number;
  weight: number;
  tone: SectionTone;
  detail?: string;
}

export interface RiderSignal {
  type: RiderType;
  status: RiderStatus;
  tone: RiderTone;
}

export interface Bottleneck {
  kind: "section" | "rider" | "tech_item" | "none";
  reason: string;
  hint: string;
  tone: "warn" | "bad" | "ok";
}

export interface Urgency {
  daysToShow: number;
  level: UrgencyLevel;
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
}

export interface ReadinessResult {
  advancingId: string;
  score: number;
  sectionsScore: number;
  ridersScore: number;
  buckets: BucketSignal[];
  fullSections: { type: SectionType; percent: number; status: AdvancingSection["status"]; tone: SectionTone }[];
  riders: {
    items: RiderSignal[];
    accepted: number;
    signed: number;
    pending: number;
    disputed: number;
    total: number;
    tone: RiderTone;
  };
  techItems: {
    total: number;
    confirmed: number;
    accepted: number;
    pending: number;
    not_available: number;
    alternative_offered: number;
    disputed: number;
  };
  urgency: Urgency;
  bottleneck: Bottleneck;
  attentionScore: number;
  isComplete: boolean;
  visaApplicable: boolean;
}

function sectionTone(percent: number, status: AdvancingSection["status"]): SectionTone {
  if (status === "complete" || status === "locked") return "ok";
  if (status === "n_a") return "ok";
  if (status === "in_progress" || percent > 0) return "partial";
  return "empty";
}

function riderTone(r: SignedRider): RiderTone {
  if (r.status === "disputed") return "bad";
  if (r.status === "accepted" || r.status === "signed") return "ok";
  return "warn";
}

function urgencyFor(showDate: string, today: Date): Urgency {
  const target = new Date(showDate + "T00:00:00").getTime();
  const days = Math.ceil((target - today.getTime()) / 86400000);
  if (days < 0) return { daysToShow: days, level: "past", label: "past", tone: "neutral" };
  if (days <= 3) return { daysToShow: days, level: "critical", label: `T-${days}`, tone: "bad" };
  if (days <= 14) return { daysToShow: days, level: "urgent", label: `${days}d`, tone: "bad" };
  if (days <= 30) return { daysToShow: days, level: "soon", label: `${days}d`, tone: "warn" };
  return { daysToShow: days, level: "calm", label: `${days}d`, tone: "ok" };
}

function urgencyMultiplier(level: UrgencyLevel): number {
  switch (level) {
    case "critical": return 4;
    case "urgent":   return 2;
    case "soon":     return 1;
    case "calm":     return 0.5;
    case "past":     return 0;
  }
}

function buildBucketSignals(snap: Snapshot, advId: string, visaApplicable: boolean) {
  const stored = snap.sections.filter((s) => s.advancing_id === advId);

  const grouped: Record<ReadinessBucket, { sumPercent: number; count: number; complete: number }> = {
    tech: { sumPercent: 0, count: 0, complete: 0 },
    logistics: { sumPercent: 0, count: 0, complete: 0 },
    travel: { sumPercent: 0, count: 0, complete: 0 },
    hospitality: { sumPercent: 0, count: 0, complete: 0 },
    contacts: { sumPercent: 0, count: 0, complete: 0 },
    visa: { sumPercent: 0, count: 0, complete: 0 },
  };

  const fullSections: ReadinessResult["fullSections"] = [];

  for (const s of stored) {
    const bucket = bucketFor(s.section_type);
    const status = s.status;
    const percent =
      status === "complete" || status === "locked" || status === "n_a" ? 100 :
      status === "empty" ? 0 :
      s.completion_percent;
    grouped[bucket].sumPercent += percent;
    grouped[bucket].count += 1;
    if (percent >= 100) grouped[bucket].complete += 1;
    fullSections.push({
      type: s.section_type,
      percent,
      status,
      tone: sectionTone(percent, status),
    });
  }

  const order: ReadinessBucket[] = ["tech", "logistics", "travel", "hospitality", "contacts", "visa"];
  const buckets: BucketSignal[] = order
    .filter((b) => b !== "visa" || visaApplicable)
    .map((b) => {
      const g = grouped[b];
      const percent = g.count > 0 ? Math.round(g.sumPercent / g.count) : 0;
      const tone: SectionTone = percent >= 100 ? "ok" : percent > 0 ? "partial" : "empty";
      return {
        bucket: b,
        label: BUCKET_LABELS[b],
        percent,
        weight: BUCKET_WEIGHTS[b],
        tone,
        detail: g.count > 1 ? `${g.complete}/${g.count}` : undefined,
      };
    });

  return { buckets, fullSections };
}

function buildRiderSignals(snap: Snapshot, advId: string) {
  const items = snap.signedRiders.filter((r) => r.advancing_id === advId);
  const signals: RiderSignal[] = items.map((r) => ({
    type: r.rider_type,
    status: r.status,
    tone: riderTone(r),
  }));
  const accepted = items.filter((r) => r.status === "accepted").length;
  const signed = items.filter((r) => r.status === "signed").length;
  const disputed = items.filter((r) => r.status === "disputed").length;
  const pending = items.filter((r) => r.status === "pending" || r.status === "sent_to_festival").length;
  const tone: RiderTone = disputed > 0 ? "bad" : pending > 0 ? "warn" : "ok";
  return { items: signals, accepted, signed, pending, disputed, total: items.length, tone };
}

function buildTechSummary(snap: Snapshot, advId: string) {
  const items = snap.techItems.filter((t) => t.advancing_id === advId);
  return {
    total: items.length,
    confirmed: items.filter((i) => i.status === "confirmed").length,
    accepted: items.filter((i) => i.status === "accepted").length,
    pending: items.filter((i) => i.status === "requested").length,
    not_available: items.filter((i) => i.status === "not_available").length,
    alternative_offered: items.filter((i) => i.status === "alternative_offered").length,
    disputed: items.filter((i) => i.status === "disputed").length,
  };
}

function pickBottleneck(
  buckets: BucketSignal[],
  riders: ReturnType<typeof buildRiderSignals>,
  tech: ReturnType<typeof buildTechSummary>,
): Bottleneck {
  const disputedRider = riders.items.find((r) => r.tone === "bad");
  if (disputedRider) {
    return {
      kind: "rider",
      reason: `${disputedRider.type === "technical" ? "Technische" : disputedRider.type === "hospitality" ? "Hospitality" : "SFX/Pyro"} rider disputed`,
      hint: `Rider disputed`,
      tone: "bad",
    };
  }

  if (tech.disputed > 0) {
    return {
      kind: "tech_item",
      reason: `${tech.disputed} tech item${tech.disputed > 1 ? "s" : ""} disputed`,
      hint: `${tech.disputed} disputed`,
      tone: "bad",
    };
  }

  const openBuckets = buckets
    .filter((b) => b.percent < 100)
    .sort((a, b) => {
      const gapA = (100 - a.percent) * a.weight;
      const gapB = (100 - b.percent) * b.weight;
      if (gapB !== gapA) return gapB - gapA;
      return b.weight - a.weight;
    });

  if (openBuckets.length > 0) {
    const top = openBuckets[0];
    const tone: "warn" | "bad" = top.percent === 0 ? "bad" : "warn";
    return {
      kind: "section",
      reason: `${top.label} ${top.percent}%${top.detail ? ` (${top.detail})` : ""}`,
      hint: `${top.label} ${top.percent}%`,
      tone,
    };
  }

  if (tech.alternative_offered > 0 || tech.not_available > 0) {
    return {
      kind: "tech_item",
      reason: `${tech.alternative_offered + tech.not_available} item(s) wachten op management-besluit`,
      hint: "wacht op besluit",
      tone: "warn",
    };
  }

  if (tech.pending > 0) {
    return {
      kind: "tech_item",
      reason: `${tech.pending} tech items pending`,
      hint: `${tech.pending} pending`,
      tone: "warn",
    };
  }

  const pendingRider = riders.items.find((r) => r.tone === "warn");
  if (pendingRider) {
    return {
      kind: "rider",
      reason: `${pendingRider.type === "technical" ? "Tech" : pendingRider.type === "hospitality" ? "Hosp." : "SFX"} rider ${pendingRider.status.replace(/_/g, " ")}`,
      hint: `Rider wacht`,
      tone: "warn",
    };
  }

  return { kind: "none", reason: "Klaar voor show", hint: "Klaar", tone: "ok" };
}

export function computeReadiness(snap: Snapshot, advancingId: string, today: Date = new Date()): ReadinessResult | null {
  const adv = snap.advancings.find((a) => a.id === advancingId);
  if (!adv) return null;
  const booking = snap.bookings.find((b) => b.id === adv.booking_id);
  if (!booking) return null;

  const stored = snap.sections.filter((s) => s.advancing_id === advancingId);
  const visaSec = stored.find((s) => s.section_type === "visa");
  const visaApplicable = !visaSec || visaSec.status !== "n_a";

  const { buckets, fullSections } = buildBucketSignals(snap, advancingId, visaApplicable);
  const riders = buildRiderSignals(snap, advancingId);
  const tech = buildTechSummary(snap, advancingId);

  const totalBucketWeight = buckets.reduce((s, x) => s + x.weight, 0) || 1;
  const sectionsScore = Math.round(
    buckets.reduce((s, b) => s + (b.percent / 100) * b.weight, 0) * 100 / totalBucketWeight,
  );

  const riderUnit = riders.total
    ? riders.items.reduce((s, r) => {
        if (r.status === "accepted") return s + 1;
        if (r.status === "signed") return s + 0.85;
        if (r.status === "sent_to_festival") return s + 0.4;
        if (r.status === "pending") return s + 0;
        if (r.status === "disputed") return s - 0.3;
        return s;
      }, 0) / riders.total
    : 1;
  const ridersScore = Math.max(0, Math.round(riderUnit * 100));

  const techUnit = tech.total
    ? (tech.accepted + tech.confirmed + tech.alternative_offered * 0.5 - tech.disputed * 0.5) / tech.total
    : 1;
  const techScore = Math.max(0, Math.round(techUnit * 100));

  const score = Math.max(0, Math.min(100, Math.round(sectionsScore * 0.6 + techScore * 0.25 + ridersScore * 0.15)));

  const urgency = urgencyFor(booking.show_date, today);
  const bottleneck = pickBottleneck(buckets, riders, tech);

  const gap = 100 - score;
  const disputedPenalty = riders.disputed * 15 + tech.disputed * 5;
  const attentionScore = Math.round(gap * urgencyMultiplier(urgency.level) + disputedPenalty);

  return {
    advancingId,
    score,
    sectionsScore,
    ridersScore,
    buckets,
    fullSections,
    riders,
    techItems: tech,
    urgency,
    bottleneck,
    attentionScore,
    isComplete: score >= 100 && riders.disputed === 0 && tech.disputed === 0,
    visaApplicable,
  };
}

export interface AttentionItem {
  advancing: Advancing;
  booking: Booking;
  artistName: string;
  festivalName: string;
  stageName: string;
  readiness: ReadinessResult;
}

export function listAttention(snap: Snapshot, limit = 5, today: Date = new Date()): AttentionItem[] {
  const items = snap.advancings
    .map((adv): AttentionItem | null => {
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking) return null;
      const readiness = computeReadiness(snap, adv.id, today);
      if (!readiness) return null;
      const artist = snap.artists.find((a) => a.id === booking.artist_id);
      const festival = snap.festivals.find((f) => f.id === booking.festival_id);
      const stage = snap.stages.find((s) => s.id === booking.stage_id);
      return {
        advancing: adv,
        booking,
        artistName: artist?.name ?? "?",
        festivalName: festival?.name ?? "?",
        stageName: stage?.name ?? "?",
        readiness,
      };
    })
    .filter((x): x is AttentionItem => !!x)
    .filter((x) => !x.readiness.isComplete && x.readiness.urgency.level !== "past")
    .sort((a, b) => b.readiness.attentionScore - a.readiness.attentionScore);
  return items.slice(0, limit);
}
