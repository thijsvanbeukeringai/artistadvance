# ArtistAdvance

Bookings agency + advancing-team platform voor DJ/electronic-music management-bedrijven. Eén tool voor twee teams, role-based access, met automatische handover bij confirm.

## Wat is het

ArtistAdvance koppelt twee workflows die normaal in losse tools leven:

- **Bookings agency** (pre-confirm): pipeline-board met drafts/holds/confirmed, deal-economics calculator (fee → commissie → withholding → artist net), auto-contract generator, festival-CRM, payment milestones, hold-management (1st/2nd/3rd + expiry), radius-conflict-detectie.
- **Advancing team** (post-confirm): crew + artist-defaults, hotels, flights met cost/recharge, 12 tech sub-secties, festival-portal via token-URL voor promoters, callsheet als PDF.

Op het moment dat een booking-agent "Bevestig" drukt, wordt een advancing-record automatisch geseed met crew, hospitality, hotel en travel-defaults uit de artist-settings. De agency raakt het niet meer aan.

## Stack

- Next.js 14 (App Router, server actions)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- @react-pdf/renderer (contract + callsheet PDFs)
- @anthropic-ai/sdk (optioneel — PDF rider parsing)

## Pages

| Route | Doel |
|---|---|
| `/` | Agency-dashboard met KPIs, drafts-banner, conflict-warnings, kalender, per-artiest bookings |
| `/landing` | Marketing landing-page |
| `/bookings` | Bookings-tabel met filter, mobile cards + desktop tabel |
| `/bookings/[id]` | Volledige booking-detail met show details, locatie + parking, deal economics, hold management, radius, contacts, flights, payment milestones, tasks, contract generator |
| `/calendar` | Maandkalender (desktop) + agenda-lijst (mobile) met click-to-add |
| `/festivals` | Festivals CRM met search, contact-editor, nieuwe-festival-form |
| `/financial` | Financieel dashboard met cashflow, outstanding, per-artiest fees, top buyers |
| `/artists/[id]` | Artist detail in agency-view |
| `/artists/[id]/settings` | Artist defaults (crew, hospitality, hotel, travel, logistics), manager, contract-template |
| `/artists/[id]/templates` | Rider + tech-requirement templates per show-type |
| `/admin/companies` | Super-admin: bedrijven CRUD met type-to-confirm delete |
| `/advancings/[id]` | Advancing-team detail (gated op role) |
| `/portal/[token]` | Artist-side portal (token-URL) |
| `/festival/[token]` | Festival-side portal (token-URL) voor tech-confirmation |

## Roles

- `super_admin` — alles, multi-agency switcher
- `agency_admin` — full agency + advancing toegang
- `agency_member` — alleen bookings-agency-views (geen advancing)
- `advancing_member` — alleen advancing-views
- `festival_admin` / `festival_member` — via token-URL toegang tot één show

## Development

```bash
npm install
cp .env.local.example .env.local   # voeg Supabase URL + ANON key toe
npm run dev                         # draait op http://localhost:3010
```

## Deployment

Gehost op Vercel. Production-database is een aparte Supabase-instance met dezelfde migrations (`migrations 001-023`).

Required env-vars (Vercel):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (optioneel, voor rider-PDF-parsing)

## Niet voor

- 1-artiest self-management
- Livemuziek-bands met grote touring crew
- Klassieke-muziek booking-only setups

Built voor DJ/electronic-music agencies met 3-50 artiesten in roster.
