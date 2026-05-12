import Link from "next/link";
import HeroWaveform from "@/components/landing/HeroWaveform";
import HandoffAnimation from "@/components/landing/HandoffAnimation";
import FAQ from "@/components/landing/FAQ";
import CookieBanner from "@/components/landing/CookieBanner";
import PricingTiers from "@/components/landing/PricingTiers";

export const metadata = {
  title: "ArtistAdvance — Bookings & advancing voor DJ/electronic-music-agencies",
  description:
    "Van hold tot callsheet. Eén platform, twee teams, nul handover. ArtistAdvance koppelt je bookings-agency-flow aan je advancing-team voor management-bedrijven met 3-50 electronic-music-artiesten.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas-deep text-white">
      <Nav />
      <Hero />
      <PainSection />
      <HowItWorks />
      <BookingsFeatures />
      <AdvancingFeatures />
      <HandoffSection />
      <DashboardSection />
      <FestivalPortalSection />
      <FeatureGrid />
      <SocialProof />
      <FAQSection />
      <Pricing />
      <FinalCTA />
      <Footer />
      <CookieBanner />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Nav                                                                         */
/* -------------------------------------------------------------------------- */
function Nav() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-canvas-deep/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-amber grid place-items-center text-canvas-deep font-extrabold">A</div>
          <span className="font-extrabold tracking-tight text-lg">ArtistAdvance</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <a href="#hoe" className="hover:text-white transition">Hoe het werkt</a>
          <a href="#bookings" className="hover:text-white transition">Bookings</a>
          <a href="#advancing" className="hover:text-white transition">Advancing</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/70 hover:text-white transition">
            Inloggen
          </Link>
          <a
            href="#cta"
            className="text-sm font-semibold bg-neon-amber hover:bg-neon-ember text-canvas-deep px-4 py-2 rounded-lg shadow-cta-glow transition"
          >
            20 min met de bouwer
          </a>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Grid overlay (CSS-only) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-100 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(249,115,22,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-24 md:py-32 grid md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neon-pulse bg-neon-amber/10 border border-neon-amber/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-amber animate-pulse" />
            Voor booking-agents &amp; advancing-teams
          </span>
          <h1
            className="mt-5 font-extrabold text-white"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            Stop met je roster runnen vanuit een Google Sheet.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/65 max-w-2xl leading-relaxed">
            Holds, radius-clauses, deal-economics en rider-confirmation in één plek. Wanneer een show confirmt, gaat 'ie automatisch naar je advancing-team. Geen e-mail-ketens, geen verloren bijlagen.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#cta"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-neon-amber hover:bg-neon-ember text-canvas-deep px-5 py-3 rounded-lg shadow-cta-glow transition"
            >
              Boek 20 min met de bouwer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="#hoe"
              className="text-sm font-semibold text-white/80 hover:text-white px-5 py-3 rounded-lg border border-white/15 hover:border-white/30 transition"
            >
              Bekijk live demo
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-[12px] text-white/40">
            <span>Role-based access</span>
            <span>·</span>
            <span>Dropbox-native</span>
            <span>·</span>
            <span>Festival-portal via token-URL</span>
          </div>
        </div>
        <div className="md:col-span-2 hidden md:flex items-end justify-end">
          <HeroWaveform />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pain section                                                                */
/* -------------------------------------------------------------------------- */
function PainSection() {
  return (
    <section className="bg-white text-ink-900 py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            Je agency runt op vier tools die elkaar niet kennen.
          </h2>
          <p className="mt-3 text-ink-500 text-lg">
            Sheet voor pipeline, Drive voor contracten, WhatsApp voor advancing, mailbox voor riders. Bij elke confirm verlies je context.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-ink-50 border border-ink-200 rounded-2xl p-6 transition-transform hover:-rotate-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-3">Nu</div>
            <div className="space-y-2.5">
              {[
                { ico: "📊", t: "Sheet met holds, niemand weet welke versie up-to-date is" },
                { ico: "📁", t: "Drive map met contracten v3_final_FINAL.pdf" },
                { ico: "💬", t: "WhatsApp-groep met crew over hotelnamen" },
                { ico: "📧", t: "Riders die heen-en-weer worden gemaild" },
                { ico: "🧮", t: "Rekenmachine voor commissie + withholding" },
              ].map((row, i) => (
                <div key={i} className="bg-white border border-ink-200 rounded-lg p-3 flex items-center gap-3 text-sm">
                  <span>{row.ico}</span>
                  <span className="text-ink-700">{row.t}</span>
                </div>
              ))}
            </div>
          </div>
          {/* After */}
          <div className="bg-canvas-deep text-white border border-neon-amber/30 rounded-2xl p-6 shadow-cta-glow transition-transform hover:rotate-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neon-pulse mb-3">Met ArtistAdvance</div>
            <div className="space-y-2.5">
              {[
                "Pipeline: drafts, holds 1st/2nd/3rd, bevestigd — één bron",
                "Auto-contract uit artist-template → PDF in Dropbox",
                "Crew + flights gekoppeld aan deze show, niet aan een appgroep",
                "Riders + tech-requirements in het festival-portal",
                "Live deal-economics: fee → commissie → withholding → artist net",
              ].map((t, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-lg p-3 flex items-start gap-3 text-sm">
                  <span className="text-neon-amber">✓</span>
                  <span className="text-white/85">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Inquiry → hold → confirmed",
      body: "Booking-agents werken in de bookings-laag: holds beheren, contracten sturen, payments tracken. Conflict-detector en radius-warnings voorkomen routing-blunders.",
    },
    {
      n: "02",
      title: "Click 'Bevestig'",
      body: "Eén klik. Advancing-record wordt aangemaakt met crew, hospitality, hotel en travel geseed uit de artist-defaults. Booking-agency klaar — geen handover-e-mail nodig.",
    },
    {
      n: "03",
      title: "Advancing-team neemt over",
      body: "Productie ziet 'm in z'n eigen view. Tech-requirements gaan naar festival-portal via token-URL. Callsheet rolt eruit als PDF. De agency raakt 't niet meer aan.",
    },
  ];
  return (
    <section id="hoe" className="bg-canvas-charcoal text-white py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-pulse">Hoe het werkt</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            Eén artist-record. Twee teams. Eén handover die zichzelf doet.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line on desktop */}
          <div aria-hidden className="hidden md:block absolute top-9 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          {steps.map((s) => (
            <div key={s.n} className="relative bg-canvas-mid border border-white/10 rounded-2xl p-6 hover:border-neon-amber/40 hover:shadow-card-glow transition-all">
              <div className="text-neon-amber font-extrabold text-xl tabular-nums">{s.n}</div>
              <h3 className="mt-3 font-extrabold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings features                                                           */
/* -------------------------------------------------------------------------- */
function BookingsFeatures() {
  const features = [
    {
      ico: <PipelineIcon />,
      title: "Pipeline-board",
      body: "Drafts, 1st/2nd/3rd holds, bevestigd. Conflict-detector vlagt same-date en radius-clashes direct.",
    },
    {
      ico: <ScaleIcon />,
      title: "Deal-economics live",
      body: "Fee → commissie % → BTW → withholding tax → artist net. Live berekend terwijl je typt. Geen Excel meer.",
    },
    {
      ico: <ContractIcon />,
      title: "Auto-contract per artiest",
      body: "Eén markdown-template per artiest met merge-tokens. PDF rolt eruit met festival, fee, promoter ingevuld.",
    },
    {
      ico: <CrmIcon />,
      title: "Festival CRM",
      body: "Per festival meerdere promoter/buyer-contacten met rollen + primary toggle. Two-way sync vanuit booking-flow.",
    },
    {
      ico: <CashIcon />,
      title: "Payment milestones",
      body: "Deposit + final + custom. Status pending / invoiced / paid / overdue. Open invoices op het dashboard.",
    },
    {
      ico: <RadiusIcon />,
      title: "Radius clauses",
      body: "Km + dagen vóór/na per booking. Automatische warning bij conflicten met al bevestigde shows.",
    },
  ];
  return (
    <section id="bookings" className="bg-white text-ink-900 py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-amber">Voor bookings-agents</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            Holds chasen zonder agenda-roulette.
          </h2>
          <p className="mt-3 text-ink-500 text-lg">
            Radius-conflicten ontdek je nu pas als de promoter klaagt. Holds verlopen zonder dat iemand chased. Deal-math doe je in een rekenmachine.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-ink-200 rounded-2xl p-5 hover:border-neon-amber/50 hover:shadow-card-glow transition-all">
              <div className="w-9 h-9 rounded-lg bg-neon-amber/10 grid place-items-center text-neon-amber mb-3">{f.ico}</div>
              <h3 className="font-bold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Advancing features                                                          */
/* -------------------------------------------------------------------------- */
function AdvancingFeatures() {
  const features = [
    {
      ico: <CrewIcon />,
      title: "Crew + artist-defaults",
      body: "Vaste touring crew per artiest. Bij elke confirm geseed in de booking — niet opnieuw aanmaken.",
    },
    {
      ico: <PlaneIcon />,
      title: "Flights + ground transfers",
      body: "Per booking inbound/outbound vluchten met PNR, kosten, en automatische ground-transfer-suggesties.",
    },
    {
      ico: <HotelIcon />,
      title: "Hotel + room-assignments",
      body: "Hotel-proposals met amenities, kamerverdeling per crewlid, en distance-to-venue.",
    },
    {
      ico: <RiderIcon />,
      title: "12 tech sub-secties",
      body: "DJ gear, monitors, audio, light, video, lasers, SFX/pyro, stage, ethernet, comms, power, backline.",
    },
    {
      ico: <CallsheetIcon />,
      title: "Callsheet als PDF",
      body: "Alle relevante info — schedule, contacts, distances, riders — automatisch als A4 callsheet.",
    },
    {
      ico: <TimelineIcon />,
      title: "Show-day timeline",
      body: "Load-in, soundcheck, programming-slots, booth-time, load-out, departure. Op de kalender en in de PDF.",
    },
  ];
  return (
    <section id="advancing" className="bg-canvas-charcoal text-white py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-pulse">Voor advancing-teams</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            Crew, travel, riders. Alles vanaf de artist-defaults.
          </h2>
          <p className="mt-3 text-white/65 text-lg">
            Elke nieuwe show begin je nu vanaf nul. Vaste crew opnieuw invoeren. Hospitality-rider opnieuw uploaden. Niet hier.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-canvas-mid border border-white/10 rounded-2xl p-5 hover:border-neon-amber/40 hover:shadow-card-glow transition-all">
              <div className="w-9 h-9 rounded-lg bg-neon-amber/10 grid place-items-center text-neon-amber mb-3">{f.ico}</div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/65 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Handoff visualization                                                       */
/* -------------------------------------------------------------------------- */
function HandoffSection() {
  return (
    <section className="bg-canvas-deep text-white py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-pulse">De handover</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>
            Click confirm. De show is van advancing.
          </h2>
          <p className="mt-4 text-white/65 text-lg">
            Geen e-mail "kun je dit overnemen". Geen Drive-map zoeken. De booking schuift letterlijk naar het andere team, met crew en defaults al ingevuld.
          </p>
        </div>
        <div className="mt-14">
          <HandoffAnimation />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard mockup                                                            */
/* -------------------------------------------------------------------------- */
function DashboardSection() {
  return (
    <section className="bg-white text-ink-900 py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neon-amber">Financieel dashboard</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
              Wat gaat er uit, wat komt er binnen, en bij welke buyer.
            </h2>
            <p className="mt-3 text-ink-500 text-lg">
              Gross bookings, agency commissie, artist net, withholding tax. Cashflow status: paid / outstanding / overdue. Top buyers en per-artiest fee-totaal.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-700">
              {[
                "Open invoices tabel met overdue-flagging",
                "Per artiest cards met gross + commissie",
                "Top 10 festivals/buyers met average fee",
                "Realtime cashflow KPIs",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-neon-amber mt-0.5">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="bg-canvas-deep border border-white/10 rounded-2xl p-5 shadow-2xl">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Gross", val: "€ 187K", tone: "white" },
          { label: "Commissie", val: "€ 18.7K", tone: "amber" },
          { label: "Artist net", val: "€ 168K", tone: "white" },
          { label: "Overdue", val: "€ 12.5K", tone: "red" },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3 border border-white/10 bg-canvas-mid">
            <div className="text-[9px] uppercase tracking-wider font-bold text-white/45">{k.label}</div>
            <div className={`text-xl font-extrabold tabular-nums mt-1 ${
              k.tone === "amber" ? "text-neon-amber" : k.tone === "red" ? "text-red-400" : "text-white"
            }`}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="bg-canvas-mid border border-white/10 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 text-[10px] uppercase tracking-wider font-bold text-white/45 flex justify-between">
          <span>Top buyers</span>
          <span>YTD</span>
        </div>
        {[
          ["Mysteryland", "8 bookings", "€ 64K"],
          ["Awakenings", "5 bookings", "€ 41K"],
          ["DGTL", "4 bookings", "€ 27K"],
          ["Lowlands", "3 bookings", "€ 22K"],
        ].map(([name, bk, gross], i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-white/85">{name}</span>
            <span className="text-[11px] text-white/50">{bk}</span>
            <span className="text-sm font-semibold text-white tabular-nums">{gross}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Festival portal                                                             */
/* -------------------------------------------------------------------------- */
function FestivalPortalSection() {
  return (
    <section className="bg-canvas-charcoal text-white py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <PortalMock />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neon-pulse">Festival-portal</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
              Stuur de promoter een link, niet een PDF van 14MB.
            </h2>
            <p className="mt-3 text-white/65 text-lg">
              Token-URL voor het festival. Promoter ziet tech-requirements en bevestigt of disputed per regel. Two-way zichtbaar voor het advancing-team. Geen account nodig, geen wachtwoord.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              {[
                "PLEASE-CONFIRM lijst die het festival per regel afvinkt",
                "Disputed riders met reden — direct zichtbaar in advancing",
                "Festival-documenten upload door promoter (stage plot, hospitality)",
                "Contactpersonen per show, geen toegang tot fee of contract",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-neon-amber mt-0.5">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortalMock() {
  return (
    <div className="bg-canvas-deep border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-wider font-bold text-white/45 mb-2">artistadvance.app/portal/...</div>
      <div className="bg-canvas-mid border border-white/10 rounded-xl p-3 space-y-2">
        {[
          { label: "Pioneer CDJ-3000 × 4", status: "ok" },
          { label: "DJM-A9 mixer", status: "ok" },
          { label: "Allen &amp; Heath PLAY+", status: "dispute" },
          { label: "RCF HDL30A line array", status: "ok" },
          { label: "Mac Pro 100W movers × 12", status: "pending" },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/85">{row.label}</span>
            {row.status === "ok" && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Confirmed</span>}
            {row.status === "dispute" && <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Disputed</span>}
            {row.status === "pending" && <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60 px-1.5 py-0.5 rounded">Open</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature grid                                                                */
/* -------------------------------------------------------------------------- */
function FeatureGrid() {
  const features = [
    "Multi-day calendar met flights + hotels",
    "Click-to-add op kalenderdagen",
    "Hold management 1st/2nd/3rd + expiry",
    "Auto-contract uit artist-template",
    "Live deal-economics calculator",
    "Festival CRM met primary contacts",
    "Payment milestones met cashflow",
    "Booking-detail met parking-map upload",
    "Crew aanmelden mirror naar booking",
    "Per-artiest filter overal",
    "Role-based access (agency / advancing)",
    "Type-to-confirm verwijderen",
    "Conflict-detectie: same-date + radius",
    "Festival-portal via token-URL",
    "Callsheet als PDF",
    "Dropbox-native file storage",
  ];
  return (
    <section className="bg-white text-ink-900 py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center" style={{ letterSpacing: "-0.02em" }}>
          In het kort.
        </h2>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {features.map((f, i) => (
            <div key={i} className="bg-ink-50 border border-ink-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-neon-amber mt-0.5">✓</span>
              <span className="text-ink-700">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Social proof                                                                */
/* -------------------------------------------------------------------------- */
function SocialProof() {
  return (
    <section className="bg-[#F8F8F8] text-ink-900 py-20">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { q: "Gemiddeld 6 uur per week minder spreadsheet-werk per agent.", who: "—", role: "" },
            { q: "Radius-conflicten gedetecteerd vóór de hold uitgaat, in plaats van na de booking.", who: "—", role: "" },
            { q: "Van confirm naar verstuurd callsheet in onder de 10 minuten.", who: "—", role: "" },
          ].map((t, i) => (
            <div key={i} className="bg-white border border-ink-200 rounded-2xl p-5">
              <p className="text-ink-700 leading-relaxed">"{t.q}"</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-ink-400">
                <span className="w-7 h-7 rounded-full bg-ink-200 grid place-items-center font-bold text-ink-500">A</span>
                <span>Pilot-claim · verifieerbaar bij onboarding</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */
function FAQSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-ink-900 text-center" style={{ letterSpacing: "-0.02em" }}>
          Wat je waarschijnlijk wil weten.
        </h2>
        <div className="mt-10">
          <FAQ />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */
function Pricing() {
  return (
    <section id="pricing" className="bg-canvas-deep text-white py-24">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-pulse">Pricing</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
            Per agency. Niet per seat.
          </h2>
          <p className="mt-3 text-white/65 text-lg">
            Schaalt met je roster-size. 14 dagen gratis proberen, daarna maandelijks of jaarlijks (20% korting jaar).
          </p>
        </div>
        <div className="mt-14">
          <PricingTiers />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                   */
/* -------------------------------------------------------------------------- */
function FinalCTA() {
  return (
    <section id="cta" className="bg-canvas-deep text-white py-28 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-3xl mx-auto px-5 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold" style={{ letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          20 minuten. Geen sales-deck. Wel je eigen roster op het scherm.
        </h2>
        <p className="mt-5 text-white/65 text-lg">
          We laten zien hoe je huidige Sheet eruit ziet binnen ArtistAdvance — bookings-flow + advancing — en of het past. Geen verplichting, geen druk.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@artistadvance.app?subject=20%20min%20demo"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-neon-amber hover:bg-neon-ember text-canvas-deep px-6 py-3.5 rounded-lg shadow-cta-glow transition"
          >
            Boek 20 min met de bouwer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <Link href="/login" className="text-sm font-semibold text-white/80 hover:text-white px-6 py-3.5 rounded-lg border border-white/15 hover:border-white/30 transition">
            Inloggen
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="bg-canvas-deep border-t border-white/5 text-white/50 py-10">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-neon-amber grid place-items-center text-canvas-deep font-extrabold text-xs">A</div>
          <span className="font-extrabold tracking-tight text-white">ArtistAdvance</span>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <a href="#hoe" className="hover:text-white transition">Hoe het werkt</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <Link href="/login" className="hover:text-white transition">Inloggen</Link>
        </div>
        <div className="text-[11px] text-white/30">© {new Date().getFullYear()} ArtistAdvance · Built voor DJ/electronic-music-agencies</div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */
function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
function PipelineIcon() { return <IconBase><path d="M3 3h18v4H3z M3 11h18v4H3z M3 19h18v4H3z" /></IconBase>; }
function ScaleIcon() { return <IconBase><path d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></IconBase>; }
function ContractIcon() { return <IconBase><path d="M14 2v6h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M9 14h6 M9 18h6 M9 10h2" /></IconBase>; }
function CrmIcon() { return <IconBase><path d="M17 21v-2a4 4 0 00-3-3.87 M9 21v-2a4 4 0 013-3.87 M12 11a4 4 0 100-8 4 4 0 000 8z" /></IconBase>; }
function CashIcon() { return <IconBase><circle cx="12" cy="12" r="10" /><path d="M16 8l-8 8 M9 8h.01 M15 16h.01" /></IconBase>; }
function RadiusIcon() { return <IconBase><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></IconBase>; }
function CrewIcon() { return <IconBase><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" /></IconBase>; }
function PlaneIcon() { return <IconBase><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></IconBase>; }
function HotelIcon() { return <IconBase><path d="M2 22V8a2 2 0 012-2h16a2 2 0 012 2v14 M2 22h20 M6 8v4 M10 8v4 M14 8v4 M18 8v4 M6 14v4 M10 14v4 M14 14v4 M18 14v4"/></IconBase>; }
function RiderIcon() { return <IconBase><path d="M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></IconBase>; }
function CallsheetIcon() { return <IconBase><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/></IconBase>; }
function TimelineIcon() { return <IconBase><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2"/></IconBase>; }
