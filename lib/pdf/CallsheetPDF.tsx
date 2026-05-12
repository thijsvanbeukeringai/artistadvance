import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AdvancingDetail, TimelineEvent } from "@/lib/types";
import { SHOW_TYPE_LABELS, CREW_ROLE_LABELS } from "@/lib/data";

// PDF gebruikt Helvetica (default) - betrouwbaar, geen externe font-fetch.
// Unicode-pijltjes worden niet ondersteund, dus we gebruiken " > " als ASCII variant.
const ARROW = " > ";

const C = {
  ink900: "#0f1115",
  ink700: "#3a4150",
  ink500: "#5b6370",
  ink400: "#8b94a6",
  ink300: "#c2c9d4",
  ink200: "#e3e6eb",
  ink100: "#f3f5f8",
  ink50:  "#f8fafc",
  brand:  "#f25a1c",
  emerald: "#16a34a",
  emeraldBg: "#ecfdf5",
  amber: "#b45309",
  amberBg: "#fffbeb",
  red: "#dc2626",
  redBg: "#fef2f2",
  sky: "#0369a1",
  skyBg: "#f0f9ff",
  violet: "#7c3aed",
  violetBg: "#f5f3ff",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 32, color: C.ink900, lineHeight: 1.35 },

  // Header
  headerBar: { borderBottomWidth: 3, borderBottomColor: C.ink900, paddingBottom: 14, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexGrow: 1 },
  eyebrow: { fontSize: 8, fontWeight: 700, color: C.brand, textTransform: "uppercase", letterSpacing: 1.4 },
  title: { fontSize: 24, fontWeight: 800, color: C.ink900, marginTop: 2, lineHeight: 1.1 },
  subtitle: { fontSize: 10, color: C.ink500, marginTop: 6 },
  headerStatus: { alignSelf: "flex-start", marginLeft: 12 },

  // At-a-glance bar (6 stat boxes)
  glanceRow: { flexDirection: "row", gap: 6, marginBottom: 18 },
  glance: { flexBasis: 0, flexGrow: 1, padding: 8, borderRadius: 4, backgroundColor: C.ink100 },
  glanceLabel: { fontSize: 7, fontWeight: 700, color: C.ink500, textTransform: "uppercase", letterSpacing: 0.8 },
  glanceValue: { fontSize: 14, fontWeight: 800, color: C.ink900, marginTop: 3 },
  glanceMeta: { fontSize: 8, color: C.ink500, marginTop: 1 },

  // Section heading
  sectionWrap: { marginBottom: 16 },
  sectionHead: { fontSize: 11, fontWeight: 800, color: C.ink900, textTransform: "uppercase", letterSpacing: 1.2, paddingBottom: 4, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: C.ink200, flexDirection: "row", alignItems: "center", gap: 6 },
  sectionAccent: { width: 3, height: 12, backgroundColor: C.brand, borderRadius: 1 },

  // Run-of-show: time | label | location | who | notes
  rosRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderRadius: 3, alignItems: "flex-start", gap: 6 },
  rosRowAlt: { backgroundColor: C.ink50 },
  rosTime: { width: 60 },
  rosTimeBig: { fontSize: 12, fontWeight: 800, color: C.ink900 },
  rosDate: { fontSize: 8, color: C.ink400, marginTop: 0 },
  rosLabel: { width: 110, fontSize: 10, fontWeight: 700, color: C.ink900 },
  rosLoc: { flexGrow: 1, fontSize: 9, color: C.ink700 },
  rosWho: { flexGrow: 1, fontSize: 9, color: C.ink700 },
  rosNotes: { flexGrow: 2, fontSize: 9, color: C.ink500 },

  // Travel timeline
  travelLane: { borderTopWidth: 1, borderTopColor: C.ink200, paddingVertical: 8, gap: 4 },
  travelDirHead: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 6, marginBottom: 2 },
  travelGrid: { flexDirection: "row", gap: 12 },
  travelCol: { flexBasis: 0, flexGrow: 1 },
  travelColFixed: { width: 130 },
  travelKvLabel: { fontSize: 7, color: C.ink400, textTransform: "uppercase", letterSpacing: 0.8 },
  travelKvValue: { fontSize: 10, fontWeight: 700, color: C.ink900 },
  travelKvSub: { fontSize: 8, color: C.ink500, marginTop: 1 },

  // Touring party table
  crewTable: { borderTopWidth: 1, borderTopColor: C.ink200 },
  crewHead: { flexDirection: "row", backgroundColor: C.ink50, paddingVertical: 4, paddingHorizontal: 6 },
  crewHeadCell: { fontSize: 7, fontWeight: 700, color: C.ink500, textTransform: "uppercase", letterSpacing: 0.8 },
  crewRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.ink200, alignItems: "center" },
  crewRowAlt: { backgroundColor: C.ink50 },

  // Two-column section
  twoCol: { flexDirection: "row", gap: 18 },
  col: { flexBasis: 0, flexGrow: 1 },

  // Contact card
  contactCard: { padding: 8, backgroundColor: C.ink50, borderRadius: 4, marginBottom: 4 },
  contactName: { fontSize: 10, fontWeight: 700, color: C.ink900 },
  contactRole: { fontSize: 8, color: C.ink500, marginTop: 1 },
  contactDetail: { fontSize: 9, color: C.ink700, marginTop: 2 },

  // Generic key-value
  kvRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: C.ink200 },
  kvKey: { flexGrow: 1, color: C.ink700 },
  kvVal: { width: 80, textAlign: "right", color: C.ink900, fontWeight: 700 },
  kvSub: { width: 60, textAlign: "right", color: C.ink500, fontSize: 9 },

  // Tech requirement row
  techCatHead: { fontSize: 10, fontWeight: 700, color: C.ink900, marginTop: 8, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.5, borderBottomColor: C.ink200 },
  techRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, alignItems: "center", borderRadius: 2 },
  techRowAlt: { backgroundColor: C.ink50 },

  // Pills
  pill: { fontSize: 7, fontWeight: 700, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, textAlign: "center", letterSpacing: 0.4 },
  pillOk:    { backgroundColor: C.emeraldBg, color: C.emerald },
  pillWarn:  { backgroundColor: C.amberBg,  color: C.amber },
  pillBad:   { backgroundColor: C.redBg,    color: C.red },
  pillInfo:  { backgroundColor: C.skyBg,    color: C.sky },
  pillNeutral: { backgroundColor: C.ink100, color: C.ink700 },
  pillBig:   { fontSize: 8, paddingHorizontal: 8, paddingVertical: 3 },

  // Role tag (small)
  roleTag: { fontSize: 7, fontWeight: 700, backgroundColor: C.ink900, color: "#fff", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2, letterSpacing: 0.4 },

  // Travel direction badges
  dirBadgeIn:  { fontSize: 8, fontWeight: 800, color: "#fff", backgroundColor: C.sky,    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, letterSpacing: 0.6 },
  dirBadgeOut: { fontSize: 8, fontWeight: 800, color: "#fff", backgroundColor: C.brand,  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, letterSpacing: 0.6 },

  meta: { fontSize: 9, color: C.ink500 },
  metaBold: { fontWeight: 700, color: C.ink900 },
  bold: { fontWeight: 700, color: C.ink900 },

  empty: { fontSize: 9, color: C.ink400 },

  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.ink400, borderTopWidth: 0.5, borderTopColor: C.ink200, paddingTop: 6 },
});

const EVENT_LABELS: Record<string, string> = {
  load_in: "Load-in",
  setup: "Set-up",
  soundcheck: "Soundcheck",
  programming_led: "LED programming",
  programming_laser: "Laser programming",
  programming_video: "Video programming",
  booth_time: "Booth time",
  doors: "Doors",
  show: "Show",
  encore: "Encore",
  curfew: "Curfew",
  load_out: "Load-out",
  departure: "Departure",
  other: "Anders",
};

const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-";
const fmtDateShort = (iso?: string) => iso ? new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }) : "-";
const fmtDateLong = (iso?: string) => iso ? new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" }) : "-";

const STATUS_PILL: Record<string, any> = {
  complete: s.pillOk,        locked: s.pillOk,
  in_progress: s.pillInfo,   pending: s.pillWarn,
  accepted: s.pillOk,        signed: s.pillOk,
  sent_to_festival: s.pillInfo,
  disputed: s.pillBad,
  confirmed: s.pillOk,
  not_available: s.pillBad,
  alternative_offered: s.pillWarn,
  requested: s.pillNeutral,
  booked: s.pillInfo,
  "n/a": s.pillNeutral,
  approved: s.pillOk,        applied: s.pillWarn,
  denied: s.pillBad,         not_needed: s.pillNeutral,
};

function Pill({ status, big = false }: { status: string; big?: boolean }) {
  const style = STATUS_PILL[status] ?? s.pillNeutral;
  return <Text style={[s.pill, style, big ? s.pillBig : {}]}>{status.replace(/_/g, " ").toUpperCase()}</Text>;
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionAccent} />
      <Text>{title}</Text>
    </View>
  );
}

export function CallsheetPDF({ detail, timeline }: { detail: AdvancingDetail; timeline: TimelineEvent[] }) {
  const { advancing, booking, artist, festival, stage, booking_crew, flights, hotel, distances, artist_contacts, festival_contacts, riders, tech_items, hospitality, logistics, visa, visa_crew } = detail;
  const sortedTimeline = [...timeline].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const inbound = flights.filter((f) => f.direction === "inbound").sort((a, b) => a.departure_datetime.localeCompare(b.departure_datetime));
  const outbound = flights.filter((f) => f.direction === "outbound").sort((a, b) => a.departure_datetime.localeCompare(b.departure_datetime));

  const techByCat: Record<string, typeof tech_items> = {};
  for (const t of tech_items) {
    techByCat[t.category] = techByCat[t.category] ?? [];
    techByCat[t.category].push(t);
  }
  const catEntries = Object.entries(techByCat);

  const generated = new Date().toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
  const docTitle = `Callsheet - ${artist.name} @ ${festival.name} - ${booking.show_date}`;

  return (
    <Document title={docTitle}>
      {/* ============================================================
          PAGE 1 - Overview, run-of-show, travel, hotel/distances
          ============================================================ */}
      <Page size="A4" style={s.page}>
        {/* Big header */}
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.eyebrow}>Callsheet · {SHOW_TYPE_LABELS[booking.show_type]}</Text>
            <Text style={s.title}>{artist.name}</Text>
            <Text style={s.subtitle}>
              <Text style={s.metaBold}>{festival.name}</Text>
              {"  "}
              <Text style={s.meta}>·  {stage.name}  ·  {festival.location ?? ""}  ·  {fmtDateLong(booking.show_date)}</Text>
            </Text>
          </View>
          <View style={s.headerStatus}>
            <Pill status={advancing.status} big />
          </View>
        </View>

        {/* AT-A-GLANCE - 6 grote stat tegels */}
        <View style={s.glanceRow}>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Show</Text>
            <Text style={s.glanceValue}>{booking.show_time?.slice(0,5) ?? "-"}</Text>
            <Text style={s.glanceMeta}>{booking.set_duration_minutes ?? "-"} min set</Text>
          </View>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Doors</Text>
            <Text style={s.glanceValue}>{booking.doors_time?.slice(0,5) ?? "-"}</Text>
            <Text style={s.glanceMeta}>festival opent</Text>
          </View>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Curfew</Text>
            <Text style={s.glanceValue}>{booking.curfew_time?.slice(0,5) ?? "-"}</Text>
            <Text style={s.glanceMeta}>strikt</Text>
          </View>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Touring party</Text>
            <Text style={s.glanceValue}>{booking_crew.filter((c) => c.is_traveling).length}</Text>
            <Text style={s.glanceMeta}>reizen mee</Text>
          </View>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Vluchten</Text>
            <Text style={s.glanceValue}>{flights.length}</Text>
            <Text style={s.glanceMeta}>{inbound.length} in / {outbound.length} uit</Text>
          </View>
          <View style={s.glance}>
            <Text style={s.glanceLabel}>Riders</Text>
            <Text style={s.glanceValue}>{riders.filter((r) => r.status === "accepted" || r.status === "signed").length}/{riders.length}</Text>
            <Text style={s.glanceMeta}>getekend</Text>
          </View>
        </View>

        {/* RUN-OF-SHOW */}
        <View style={s.sectionWrap}>
          <SectionHead title="Run-of-show" />
          {sortedTimeline.length === 0 ? (
            <Text style={s.empty}>Nog geen momenten vastgelegd in de timeline.</Text>
          ) : (
            <View>
              {sortedTimeline.map((ev, i) => {
                const dt = new Date(ev.datetime);
                return (
                  <View key={ev.id} style={[s.rosRow, i % 2 === 1 ? s.rosRowAlt : {}]}>
                    <View style={s.rosTime}>
                      <Text style={s.rosTimeBig}>{dt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</Text>
                      <Text style={s.rosDate}>{dt.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}</Text>
                    </View>
                    <Text style={s.rosLabel}>{EVENT_LABELS[ev.event_type] ?? ev.event_type}</Text>
                    <Text style={s.rosLoc}>{ev.location ?? "-"}</Text>
                    <Text style={s.rosWho}>{ev.responsible_contact ?? "-"}</Text>
                    <Text style={s.rosNotes}>{ev.notes ?? ""}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* TRAVEL TIMELINE */}
        <View style={s.sectionWrap}>
          <SectionHead title="Travel timeline" />
          {flights.length === 0 ? (
            <Text style={s.empty}>Geen vluchten geregistreerd.</Text>
          ) : (
            <View>
              {inbound.length > 0 && <Text style={[s.travelDirHead, { color: C.sky }]}>Inbound ({inbound.length})</Text>}
              {inbound.map((f) => <FlightBlock key={f.id} flight={f} />)}
              {outbound.length > 0 && <Text style={[s.travelDirHead, { color: C.brand }]}>Outbound ({outbound.length})</Text>}
              {outbound.map((f) => <FlightBlock key={f.id} flight={f} />)}
            </View>
          )}
        </View>

        {/* DISTANCES + HOTEL */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <SectionHead title="Afstanden" />
            {distances.airport_hotel_km != null && (
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Airport{ARROW}Hotel</Text>
                <Text style={s.kvVal}>{distances.airport_hotel_km} km</Text>
                <Text style={s.kvSub}>{distances.airport_hotel_minutes ?? "-"} min</Text>
              </View>
            )}
            {distances.hotel_venue_km != null && (
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Hotel{ARROW}Venue</Text>
                <Text style={s.kvVal}>{distances.hotel_venue_km} km</Text>
                <Text style={s.kvSub}>{distances.hotel_venue_minutes ?? "-"} min</Text>
              </View>
            )}
            {distances.venue_airport_km != null && (
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Venue{ARROW}Airport</Text>
                <Text style={s.kvVal}>{distances.venue_airport_km} km</Text>
                <Text style={s.kvSub}>{distances.venue_airport_minutes ?? "-"} min</Text>
              </View>
            )}
            {distances.airport_hotel_km == null && distances.hotel_venue_km == null && distances.venue_airport_km == null && (
              <Text style={s.empty}>Niet ingevuld.</Text>
            )}
          </View>
          <View style={s.col}>
            <SectionHead title="Hotel" />
            {hotel.hotel_required ? (
              <View>
                {hotel.hotel_confirmed_name ? (
                  <Text><Text style={s.bold}>{hotel.hotel_confirmed_name}</Text>{hotel.hotel_star_rating ? ` · ${hotel.hotel_star_rating}` : ""}</Text>
                ) : hotel.hotel_preference ? (
                  <Text>Voorkeur: <Text style={s.bold}>{hotel.hotel_preference}</Text></Text>
                ) : null}
                <Text style={s.meta}>
                  {hotel.hotel_room_count ?? "?"} kamer{hotel.hotel_room_count === 1 ? "" : "s"}
                  {hotel.hotel_room_type ? ` (${hotel.hotel_room_type})` : ""}
                  {hotel.hotel_nights ? ` · ${hotel.hotel_nights} nacht${hotel.hotel_nights === 1 ? "" : "en"}` : ""}
                </Text>
                {hotel.hotel_check_in && (
                  <Text style={s.meta}>
                    Check-in <Text style={s.metaBold}>{fmtDateShort(hotel.hotel_check_in)}</Text>
                    {"   >   "}
                    Check-out <Text style={s.metaBold}>{fmtDateShort(hotel.hotel_check_out)}</Text>
                  </Text>
                )}
                {hotel.hotel_late_checkout && <Text style={s.meta}>Late check-out: ja</Text>}
                {hotel.hotel_nights_description && <Text style={s.meta}>{hotel.hotel_nights_description}</Text>}
              </View>
            ) : (
              <Text style={s.empty}>Geen hotel nodig.</Text>
            )}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>{artist.name} @ {festival.name} · {fmtDateShort(booking.show_date)}</Text>
          <Text render={({ pageNumber, totalPages }) => `pagina ${pageNumber} / ${totalPages}`} />
          <Text>{generated}</Text>
        </View>
      </Page>

      {/* ============================================================
          PAGE 2 - Touring party, contacts, hospitality, visa
          ============================================================ */}
      <Page size="A4" style={s.page}>
        <View style={[s.headerBar, { borderBottomWidth: 1 }]}>
          <View style={s.headerLeft}>
            <Text style={s.eyebrow}>Touring & on-site</Text>
            <Text style={[s.title, { fontSize: 16 }]}>{artist.name} @ {festival.name}</Text>
          </View>
          <Text style={s.meta}>{fmtDateLong(booking.show_date)}</Text>
        </View>

        {/* Touring party */}
        <View style={s.sectionWrap}>
          <SectionHead title={`Touring party (${booking_crew.filter((c) => c.is_traveling).length}/${booking_crew.length})`} />
          {booking_crew.length === 0 ? (
            <Text style={s.empty}>Geen touring party vastgelegd.</Text>
          ) : (
            <View style={s.crewTable}>
              <View style={s.crewHead}>
                <Text style={[s.crewHeadCell, { width: 40 }]}>Rol</Text>
                <Text style={[s.crewHeadCell, { flexGrow: 2 }]}>Naam</Text>
                <Text style={[s.crewHeadCell, { flexGrow: 2 }]}>Functie</Text>
                <Text style={[s.crewHeadCell, { width: 50 }]}>Reist</Text>
                <Text style={[s.crewHeadCell, { width: 60 }]}>Flight</Text>
                <Text style={[s.crewHeadCell, { flexGrow: 2 }]}>Notitie</Text>
              </View>
              {booking_crew.map((c, i) => (
                <View key={c.id} style={[s.crewRow, i % 2 === 1 ? s.crewRowAlt : {}]}>
                  <View style={{ width: 40 }}><Text style={s.roleTag}>{c.role.toUpperCase()}</Text></View>
                  <Text style={[{ flexGrow: 2 }, s.bold]}>{c.name}</Text>
                  <Text style={[{ flexGrow: 2, color: C.ink500 }]}>{CREW_ROLE_LABELS[c.role] ?? c.role}</Text>
                  <Text style={[{ width: 50, color: c.is_traveling ? C.emerald : C.ink400, fontWeight: 700 }]}>{c.is_traveling ? "Ja" : "Nee"}</Text>
                  <View style={{ width: 60 }}><Pill status={c.flight_status} /></View>
                  <Text style={[{ flexGrow: 2, color: C.ink500 }]}>{c.notes ?? "-"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contacts */}
        <View style={[s.twoCol, { marginBottom: 14 }]}>
          <View style={s.col}>
            <SectionHead title={`Artist contacten (${artist_contacts.length})`} />
            {artist_contacts.length === 0 ? <Text style={s.empty}>Geen contacten.</Text> :
              artist_contacts.map((c) => (
                <View key={c.id} style={s.contactCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={s.contactName}>{c.name}</Text>
                    {c.is_onsite && <Text style={[s.pill, s.pillOk]}>ON-SITE</Text>}
                  </View>
                  <Text style={s.contactRole}>{c.role}</Text>
                  {(c.email || c.phone) && (
                    <Text style={s.contactDetail}>{[c.email, c.phone].filter(Boolean).join("  ·  ")}</Text>
                  )}
                </View>
              ))
            }
          </View>
          <View style={s.col}>
            <SectionHead title={`Festival contacten (${festival_contacts.length})`} />
            {festival_contacts.length === 0 ? <Text style={s.empty}>Geen contacten.</Text> :
              festival_contacts.map((c) => (
                <View key={c.id} style={s.contactCard}>
                  <Text style={s.contactName}>{c.name}</Text>
                  <Text style={s.contactRole}>{c.role}</Text>
                  {(c.email || c.phone) && (
                    <Text style={s.contactDetail}>{[c.email, c.phone].filter(Boolean).join("  ·  ")}</Text>
                  )}
                </View>
              ))
            }
          </View>
        </View>

        {/* Hospitality */}
        <View style={s.sectionWrap}>
          <SectionHead title="Hospitality" />
          <View style={s.glanceRow}>
            <View style={s.glance}>
              <Text style={s.glanceLabel}>Party size</Text>
              <Text style={s.glanceValue}>{hospitality.party_size ?? "-"}</Text>
            </View>
            <View style={s.glance}>
              <Text style={s.glanceLabel}>Hot meal</Text>
              <Text style={s.glanceValue}>{hospitality.hot_meal_required ? "Ja" : "Nee"}</Text>
            </View>
            <View style={s.glance}>
              <Text style={s.glanceLabel}>Dressing rooms</Text>
              <Text style={s.glanceValue}>{hospitality.dressing_room_count ?? "-"}</Text>
            </View>
          </View>
          {hospitality.specific_requests && (
            <Text style={s.meta}>
              <Text style={s.metaBold}>Specifieke verzoeken:</Text> {hospitality.specific_requests}
            </Text>
          )}
        </View>

        {/* Visa */}
        {visa && (visa.visa_required || visa.work_permit_required) && (
          <View style={s.sectionWrap}>
            <SectionHead title="Visa / paperwork" />
            <Text style={s.meta}>
              {visa.visa_required && <Text>Visa vereist: <Text style={s.metaBold}>{visa.visa_type ?? "ja"}</Text>{visa.deadline ? `   ·   deadline ${fmtDateShort(visa.deadline)}` : ""}</Text>}
              {visa.work_permit_required && <Text>{visa.visa_required ? "   ·   " : ""}Werkvergunning vereist</Text>}
            </Text>
            {visa.notes && <Text style={[s.meta, { marginTop: 3 }]}>{visa.notes}</Text>}
            {visa_crew.length > 0 && (
              <View style={[s.crewTable, { marginTop: 6 }]}>
                <View style={s.crewHead}>
                  <Text style={[s.crewHeadCell, { flexGrow: 1 }]}>Crew lid</Text>
                  <Text style={[s.crewHeadCell, { width: 80 }]}>Status</Text>
                </View>
                {visa_crew.map((v, i) => (
                  <View key={v.id} style={[s.crewRow, i % 2 === 1 ? s.crewRowAlt : {}]}>
                    <Text style={[{ flexGrow: 1 }, s.bold]}>{v.name}</Text>
                    <View style={{ width: 80 }}><Pill status={v.status} /></View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{artist.name} @ {festival.name} · {fmtDateShort(booking.show_date)}</Text>
          <Text render={({ pageNumber, totalPages }) => `pagina ${pageNumber} / ${totalPages}`} />
          <Text>{generated}</Text>
        </View>
      </Page>

      {/* ============================================================
          PAGE 3 - Tech, riders, notes
          ============================================================ */}
      <Page size="A4" style={s.page}>
        <View style={[s.headerBar, { borderBottomWidth: 1 }]}>
          <View style={s.headerLeft}>
            <Text style={s.eyebrow}>Production specs</Text>
            <Text style={[s.title, { fontSize: 16 }]}>Tech & riders</Text>
          </View>
          <Text style={s.meta}>{artist.name} · {fmtDateLong(booking.show_date)}</Text>
        </View>

        {/* Tech */}
        <View style={s.sectionWrap}>
          <SectionHead title={`Tech requirements (${tech_items.length})`} />
          {catEntries.length === 0 ? (
            <Text style={s.empty}>Geen tech items.</Text>
          ) : (
            catEntries.map(([cat, items]) => (
              <View key={cat} wrap={false}>
                <Text style={s.techCatHead}>{cat.replace(/_/g, " ").toUpperCase()} ({items.length})</Text>
                {items.map((it, i) => (
                  <View key={it.id} style={[s.techRow, i % 2 === 1 ? s.techRowAlt : {}]}>
                    <View style={{ flexGrow: 3 }}>
                      <Text>{it.is_mandatory && <Text style={{ color: C.red, fontWeight: 700 }}>★ </Text>}<Text style={s.bold}>{it.item_description}</Text></Text>
                      {it.artist_notes && <Text style={[s.meta, { fontSize: 8 }]}>{it.artist_notes}</Text>}
                    </View>
                    <Text style={[{ flexGrow: 2, color: C.ink500, fontSize: 9 }]}>{it.alternative_description ?? it.festival_response ?? ""}</Text>
                    <View style={{ width: 90 }}><Pill status={it.status} /></View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Riders */}
        <View style={s.sectionWrap}>
          <SectionHead title={`Rider status (${riders.length})`} />
          {riders.length === 0 ? (
            <Text style={s.empty}>Geen riders.</Text>
          ) : (
            <View style={s.crewTable}>
              {riders.map((r, i) => (
                <View key={r.id} style={[s.crewRow, i % 2 === 1 ? s.crewRowAlt : {}]}>
                  <View style={{ flexGrow: 1 }}>
                    <Text style={s.bold}>
                      {r.rider_type === "technical" ? "Technische rider" : r.rider_type === "hospitality" ? "Hospitality rider" : "SFX/Pyro rider"}
                    </Text>
                    {r.signed_by_name && (
                      <Text style={[s.meta, { fontSize: 8 }]}>
                        Getekend door <Text style={s.metaBold}>{r.signed_by_name}</Text>
                        {r.signed_by_role ? ` (${r.signed_by_role})` : ""}
                        {r.signed_at ? `  ·  ${fmtDateShort(r.signed_at)}` : ""}
                      </Text>
                    )}
                    {r.dispute_notes && <Text style={[s.meta, { color: C.red, fontSize: 8 }]}>{r.dispute_notes}</Text>}
                  </View>
                  <View style={{ width: 90 }}><Pill status={r.status} /></View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Logistics notes */}
        {logistics.notes && (
          <View style={s.sectionWrap}>
            <SectionHead title="Logistiek notities" />
            <Text style={s.meta}>{logistics.notes}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{artist.name} @ {festival.name} · {fmtDateShort(booking.show_date)}</Text>
          <Text render={({ pageNumber, totalPages }) => `pagina ${pageNumber} / ${totalPages}`} />
          <Text>{generated}</Text>
        </View>
      </Page>
    </Document>
  );
}

function FlightBlock({ flight }: { flight: any }) {
  return (
    <View style={s.travelLane} wrap={false}>
      <View style={s.travelGrid}>
        <View style={s.travelColFixed}>
          <Text style={s.travelKvLabel}>Vlucht</Text>
          <Text style={s.travelKvValue}>{flight.airline} {flight.flight_number}</Text>
          <Text style={s.travelKvSub}>{flight.departure_airport}{ARROW}{flight.arrival_airport}</Text>
          {flight.booking_reference && (
            <Text style={[s.travelKvSub, { marginTop: 2 }]}>
              PNR: <Text style={s.metaBold}>{flight.booking_reference}</Text>
            </Text>
          )}
        </View>
        <View style={s.travelColFixed}>
          <Text style={s.travelKvLabel}>Vertrek</Text>
          <Text style={s.travelKvValue}>{fmtTime(flight.departure_datetime)}</Text>
          <Text style={s.travelKvSub}>{fmtDateShort(flight.departure_datetime)} · {flight.departure_airport}</Text>
          <Text style={[s.travelKvLabel, { marginTop: 4 }]}>Aankomst</Text>
          <Text style={s.travelKvValue}>{fmtTime(flight.arrival_datetime)}</Text>
          <Text style={s.travelKvSub}>{fmtDateShort(flight.arrival_datetime)} · {flight.arrival_airport}</Text>
        </View>
        <View style={s.travelCol}>
          <Text style={s.travelKvLabel}>Passagiers ({flight.passengers.length})</Text>
          {flight.passengers.length === 0 ? (
            <Text style={s.empty}>-</Text>
          ) : (
            flight.passengers.map((p: string, i: number) => (
              <Text key={i} style={{ fontSize: 9, color: C.ink700, marginTop: 1 }}>· {p}</Text>
            ))
          )}
          {flight.notes && <Text style={[s.meta, { marginTop: 4, fontSize: 8 }]}>{flight.notes}</Text>}
        </View>
        <View style={{ width: 60 }}>
          <Text style={s.travelKvLabel}>Status</Text>
          <View style={{ marginTop: 2 }}><Pill status={flight.status ?? "pending"} /></View>
        </View>
      </View>
    </View>
  );
}
