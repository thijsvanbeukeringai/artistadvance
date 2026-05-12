"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Voor wie is dit eigenlijk?",
    a: "Management-bedrijven met 3 tot 50 electronic-music-artiesten in roster. Twee teams (bookings-agency + advancing/production) die nu in losse tools werken. Niet voor 1-artiest-self-management of livemuziek-bands met touring crew.",
  },
  {
    q: "Hoe werkt de handoff van bookings naar advancing precies?",
    a: "Een booking begint als draft bij de agency. Een agent doorloopt hold-positie, contract, deal-economics. Op het moment dat hij 'Bevestig' drukt, wordt automatisch een advancing-record aangemaakt met crew, hospitality, hotel, travel en logistics geseed vanuit de artist-defaults. De booking-agency-medewerker ziet daarna geen advancing-velden meer — die zitten in een aparte role-based view.",
  },
  {
    q: "Welke role-types bestaan er?",
    a: "super_admin, agency_admin, agency_member, advancing_member, festival_admin, festival_member. agency_member werkt in bookings, advancing_member in advancing. agency_admin ziet beide. Festival-medewerkers krijgen alleen toegang tot één show via een token-URL.",
  },
  {
    q: "Hoe zit het met Dropbox?",
    a: "Per advancing wordt automatisch een Dropbox-folder gemaakt voor riders, callsheets en festival-documents. Bestanden worden gesynct, geen dubbele opslag. Bestaande Dropbox-structuren blijven intact.",
  },
  {
    q: "Werkt het ook voor non-EU shows? BTW en withholding tax?",
    a: "Ja. Per booking kun je commission_pct, vat_pct en withholding_tax_pct instellen. Artist-net wordt live berekend. Currency is in v1 EUR-gefocust; multi-currency met FX-lock staat in de roadmap.",
  },
  {
    q: "Kan een promoter meekijken in de advancing?",
    a: "Ja, via een token-URL gericht op de festival-portal. De promoter ziet alleen wat hij nodig heeft: tech-requirements om te bevestigen of disputen, festival-documenten upload, contact-personen. Geen toegang tot fee, contract of andere shows.",
  },
  {
    q: "Wat gebeurt er met radius-clauses?",
    a: "Per booking stel je radius_km, radius_days_before en radius_days_after in. Als je een nieuwe booking maakt binnen die window voor dezelfde artiest, krijg je automatisch een warning. Conflict-detector draait ook op same-date conflicts.",
  },
  {
    q: "Hoe verloopt onboarding vanaf onze huidige sheet?",
    a: "We exporteren je rooster, festivals en bookings vanuit CSV of Notion. Artist-defaults (vaste crew, standaard hospitality/hotel) stel je 1× in en die seeden elke volgende booking. Eerste live show binnen 1-2 weken realistisch.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="bg-white border border-ink-200 rounded-xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-ink-50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-ink-900">{f.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-ink-500 transition-transform ${isOpen ? "rotate-45" : ""}`}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm text-ink-700 leading-relaxed">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
