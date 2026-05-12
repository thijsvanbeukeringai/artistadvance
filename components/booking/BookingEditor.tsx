"use client";

import { useMemo, useState, useTransition } from "react";
import { updateBookingAction, uploadParkingMapAction, removeParkingMapAction } from "@/lib/actions";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import type { Booking, Festival, Stage, ShowType, HoldStatus, ExclusivityType } from "@/lib/types";

export default function BookingEditor({
  booking,
  festivals,
  stages,
}: {
  booking: Booking;
  festivals: Festival[];
  stages: Stage[];
}) {
  // Show details
  const [festivalId, setFestivalId] = useState(booking.festival_id);
  const [stageId, setStageId] = useState(booking.stage_id);
  const [showType, setShowType] = useState<ShowType>(booking.show_type);
  const [showDate, setShowDate] = useState(booking.show_date);
  const [showTime, setShowTime] = useState(booking.show_time ?? "");
  const [duration, setDuration] = useState(booking.set_duration_minutes?.toString() ?? "");
  const [billingPosition, setBillingPosition] = useState(booking.billing_position ?? "");
  const [slotPosition, setSlotPosition] = useState(booking.slot_position ?? "");
  const [b2bPartner, setB2bPartner] = useState(booking.b2b_partner ?? "");

  // Location
  const [venueAddress, setVenueAddress] = useState(booking.venue_address ?? "");
  const [venuePostcode, setVenuePostcode] = useState(booking.venue_postcode ?? "");
  const [venueCity, setVenueCity] = useState(booking.venue_city ?? "");
  const [venueCountry, setVenueCountry] = useState(booking.venue_country ?? "");
  const [parkingInfo, setParkingInfo] = useState(booking.parking_info ?? "");

  // Commercial
  const [fee, setFee] = useState(booking.fee?.toString() ?? "");
  const [commissionPct, setCommissionPct] = useState(booking.commission_pct?.toString() ?? "10");
  const [vatPct, setVatPct] = useState(booking.vat_pct?.toString() ?? "0");
  const [withholdingPct, setWithholdingPct] = useState(booking.withholding_tax_pct?.toString() ?? "0");
  const [travelBuyout, setTravelBuyout] = useState(booking.travel_buyout?.toString() ?? "");
  const [hotelBuyout, setHotelBuyout] = useState(booking.hotel_buyout?.toString() ?? "");
  const [guarantee, setGuarantee] = useState(booking.guarantee ?? "");
  const [contributions, setContributions] = useState(booking.contributions ?? "");
  const [contractStatus, setContractStatus] = useState(booking.contract_status ?? "");

  // Hold
  const [holdPosition, setHoldPosition] = useState(booking.hold_position?.toString() ?? "");
  const [holdStatus, setHoldStatus] = useState<HoldStatus | "">(booking.hold_status ?? "");
  const [holdExpiresAt, setHoldExpiresAt] = useState(
    booking.hold_expires_at ? booking.hold_expires_at.slice(0, 16) : ""
  );

  // Radius / exclusivity
  const [radiusKm, setRadiusKm] = useState(booking.radius_km?.toString() ?? "");
  const [radiusBefore, setRadiusBefore] = useState(booking.radius_days_before?.toString() ?? "");
  const [radiusAfter, setRadiusAfter] = useState(booking.radius_days_after?.toString() ?? "");
  const [exclusivityType, setExclusivityType] = useState<ExclusivityType>((booking.exclusivity_type as ExclusivityType) ?? "none");

  const [isLooped, setIsLooped] = useState(!!booking.is_looped);

  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Calculated economics
  const feeNum = parseFloat(fee) || 0;
  const commissionNum = parseFloat(commissionPct) || 0;
  const withholdingNum = parseFloat(withholdingPct) || 0;
  const vatNum = parseFloat(vatPct) || 0;
  const agencyCommission = feeNum * (commissionNum / 100);
  const withholdingAmount = feeNum * (withholdingNum / 100);
  const artistNet = feeNum - agencyCommission - withholdingAmount;
  const vatAmount = feeNum * (vatNum / 100);

  const stagesForFestival = useMemo(
    () => stages.filter((s) => s.festival_id === festivalId),
    [stages, festivalId]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await updateBookingAction(booking.id, {
        festival_id: festivalId,
        stage_id: stageId,
        show_type: showType,
        show_date: showDate,
        show_time: showTime.trim() || null,
        set_duration_minutes: duration.trim() ? Number(duration) : null,
        billing_position: billingPosition.trim() || null,
        slot_position: slotPosition.trim() || null,
        b2b_partner: b2bPartner.trim() || null,
        venue_address: venueAddress.trim() || null,
        venue_postcode: venuePostcode.trim() || null,
        venue_city: venueCity.trim() || null,
        venue_country: venueCountry.trim() || null,
        parking_info: parkingInfo.trim() || null,
        fee: fee.trim() ? Number(fee) : null,
        commission_pct: commissionPct.trim() ? Number(commissionPct) : null,
        vat_pct: vatPct.trim() ? Number(vatPct) : null,
        withholding_tax_pct: withholdingPct.trim() ? Number(withholdingPct) : null,
        travel_buyout: travelBuyout.trim() ? Number(travelBuyout) : null,
        hotel_buyout: hotelBuyout.trim() ? Number(hotelBuyout) : null,
        guarantee: guarantee.trim() || null,
        contributions: contributions.trim() || null,
        contract_status: contractStatus.trim() || null,
        hold_position: holdPosition.trim() ? Number(holdPosition) : null,
        hold_status: holdStatus || null,
        hold_expires_at: holdExpiresAt ? new Date(holdExpiresAt).toISOString() : null,
        radius_km: radiusKm.trim() ? Number(radiusKm) : null,
        radius_days_before: radiusBefore.trim() ? Number(radiusBefore) : null,
        radius_days_after: radiusAfter.trim() ? Number(radiusAfter) : null,
        exclusivity_type: exclusivityType,
        is_looped: isLooped,
      });
      if (result.ok) {
        setSavedAt(Date.now());
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Show details */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Show details</h3>
        </header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Festival *">
            <select value={festivalId} onChange={(e) => { setFestivalId(e.target.value); setStageId(""); }} className={selectCls} required>
              {festivals.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.location})</option>)}
            </select>
          </Field>
          <Field label="Stage *">
            <select value={stageId} onChange={(e) => setStageId(e.target.value)} className={selectCls} required>
              <option value="">— Kies stage —</option>
              {stagesForFestival.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Show type">
            <select value={showType} onChange={(e) => setShowType(e.target.value as ShowType)} className={selectCls}>
              {Object.entries(SHOW_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Datum *">
            <input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Show tijd">
            <input type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Set duur (min)">
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" className={inputCls} />
          </Field>
          <Field label="Billing position">
            <select value={billingPosition} onChange={(e) => setBillingPosition(e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="headline">Headline</option>
              <option value="co_headline">Co-headline</option>
              <option value="support">Support</option>
              <option value="special_guest">Special guest</option>
              <option value="opener">Opener</option>
            </select>
          </Field>
          <Field label="Slot positie">
            <select value={slotPosition} onChange={(e) => setSlotPosition(e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="opener">Opener</option>
              <option value="main">Main</option>
              <option value="closing">Closing</option>
              <option value="b2b">B2B</option>
              <option value="other">Anders</option>
            </select>
          </Field>
          <Field label="B2B partner">
            <input value={b2bPartner} onChange={(e) => setB2bPartner(e.target.value)} placeholder="vb. Sam Feldt" className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Locatie & parking */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Locatie & parking</h3>
        </header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Venue adres" wide>
            <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Straat + huisnummer" className={inputCls} />
          </Field>
          <Field label="Postcode">
            <input value={venuePostcode} onChange={(e) => setVenuePostcode(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Plaats">
            <input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Land">
            <input value={venueCountry} onChange={(e) => setVenueCountry(e.target.value)} placeholder="Nederland" className={inputCls} />
          </Field>
          <Field label="Parking instructies" wide>
            <textarea value={parkingInfo} onChange={(e) => setParkingInfo(e.target.value)} placeholder="vb. Crew-entrance ingang Noord, parkeerterrein P3, pas tonen bij hekje." className={`${inputCls} min-h-[80px]`} />
          </Field>
          <div className="md:col-span-2 lg:col-span-4">
            <ParkingMapBlock bookingId={booking.id} currentUrl={booking.parking_map_url ?? null} />
          </div>
        </div>
      </section>

      {/* Deal economics */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Deal economics (EUR)</h3>
        </header>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Fee gross">
              <input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Commissie %">
              <input type="number" step="0.01" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} placeholder="10" className={inputCls} />
            </Field>
            <Field label="BTW %">
              <input type="number" step="0.01" value={vatPct} onChange={(e) => setVatPct(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Withholding tax %">
              <input type="number" step="0.01" value={withholdingPct} onChange={(e) => setWithholdingPct(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Travel buyout">
              <input type="number" step="0.01" value={travelBuyout} onChange={(e) => setTravelBuyout(e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Hotel buyout">
              <input type="number" step="0.01" value={hotelBuyout} onChange={(e) => setHotelBuyout(e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Contract status">
              <select value={contractStatus} onChange={(e) => setContractStatus(e.target.value)} className={selectCls}>
                <option value="">—</option>
                <option value="pending">Pending</option>
                <option value="drafted">Drafted</option>
                <option value="sent">Verstuurd</option>
                <option value="counter_received">Counter ontvangen</option>
                <option value="counter_signed">Counter-signed</option>
                <option value="signed">Fully signed</option>
              </select>
            </Field>
            <Field label="Looped">
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={isLooped} onChange={(e) => setIsLooped(e.target.checked)} />
                <span className="text-xs text-ink-700">Multi-show deal</span>
              </label>
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-ink-50 rounded-lg p-3">
            <Calc label="Agency commissie" value={agencyCommission} />
            <Calc label="Withholding tax" value={withholdingAmount} />
            <Calc label="Artist net" value={artistNet} bold />
            <Calc label="BTW (info)" value={vatAmount} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Guarantee / deal-notitie">
              <input value={guarantee} onChange={(e) => setGuarantee(e.target.value)} placeholder="vb. 5000 EUR + flight + 2 hotel" className={inputCls} />
            </Field>
            <Field label="Contributions">
              <input value={contributions} onChange={(e) => setContributions(e.target.value)} placeholder="vb. share of door / bonus terms" className={inputCls} />
            </Field>
          </div>
        </div>
      </section>

      {/* Hold management */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Hold management</h3>
        </header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Hold positie">
            <select value={holdPosition} onChange={(e) => setHoldPosition(e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="1">1st hold</option>
              <option value="2">2nd hold</option>
              <option value="3">3rd hold</option>
            </select>
          </Field>
          <Field label="Hold status">
            <select value={holdStatus} onChange={(e) => setHoldStatus(e.target.value as HoldStatus | "")} className={selectCls}>
              <option value="">—</option>
              <option value="active">Active</option>
              <option value="challenged">Challenged</option>
              <option value="released">Released</option>
              <option value="confirmed">Confirmed</option>
              <option value="expired">Expired</option>
            </select>
          </Field>
          <Field label="Hold vervalt op">
            <input type="datetime-local" value={holdExpiresAt} onChange={(e) => setHoldExpiresAt(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* Radius / exclusivity */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Radius / exclusivity</h3>
        </header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Radius (km)">
            <input type="number" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} placeholder="200" className={inputCls} />
          </Field>
          <Field label="Dagen vóór">
            <input type="number" value={radiusBefore} onChange={(e) => setRadiusBefore(e.target.value)} placeholder="30" className={inputCls} />
          </Field>
          <Field label="Dagen na">
            <input type="number" value={radiusAfter} onChange={(e) => setRadiusAfter(e.target.value)} placeholder="30" className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={exclusivityType} onChange={(e) => setExclusivityType(e.target.value as ExclusivityType)} className={selectCls}>
              <option value="none">Geen</option>
              <option value="festival">Festival exclusive</option>
              <option value="brand">Brand exclusive</option>
              <option value="city">City exclusive</option>
            </select>
          </Field>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-3 z-10">
        {savedAt && Date.now() - savedAt < 3000 && (
          <span className="text-xs text-emerald-700 font-semibold bg-white border border-emerald-200 px-3 py-1.5 rounded-md shadow-card">✓ Opgeslagen</span>
        )}
        <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50 shadow-card">
          {pending ? "Opslaan..." : "Wijzigingen opslaan"}
        </button>
      </div>
    </form>
  );
}

function ParkingMapBlock({ bookingId, currentUrl }: { bookingId: string; currentUrl: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadParkingMapAction(bookingId, fd);
      if (!result.ok) setError(result.error);
    });
  }

  function onRemove() {
    if (!confirm("Parking map verwijderen?")) return;
    start(async () => {
      await removeParkingMapAction(bookingId);
    });
  }

  return (
    <div className="bg-ink-50 border border-ink-200 rounded-lg p-3">
      <div className="text-[11px] font-semibold text-ink-700 mb-2">Parking map / venue-plattegrond (PDF of afbeelding)</div>
      {currentUrl ? (
        <div className="flex items-center justify-between gap-3">
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 font-semibold hover:underline truncate">
            📎 Bekijk huidige upload
          </a>
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded cursor-pointer">
              Vervangen
              <input type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" disabled={pending} />
            </label>
            <button type="button" onClick={onRemove} disabled={pending} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">
              Verwijder
            </button>
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="text-xs text-ink-500">Upload PDF of foto van parking-instructies</span>
          <input type="file" accept="image/*,application/pdf" onChange={onFile} disabled={pending} className="mt-1 block w-full text-xs" />
        </label>
      )}
      {pending && <div className="text-[11px] text-ink-500 mt-1">Bezig met upload...</div>}
      {error && <div className="text-[11px] text-red-700 mt-1">{error}</div>}
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2 lg:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold text-ink-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Calc({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{label}</div>
      <div className={`tabular-nums mt-0.5 ${bold ? "text-ink-900 font-extrabold text-base" : "text-ink-700 font-semibold"}`}>
        € {value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

const inputCls = "w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
const selectCls = "w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white";
