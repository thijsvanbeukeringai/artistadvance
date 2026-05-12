type Template = {
  key: string;
  name: string;
  description: string;
  trigger: string;
  subject: string;
  body: string;
};

const TEMPLATES: Template[] = [
  {
    key: "tech_advancing",
    name: "Technical advancing",
    description: "Naar festival bij booking confirmed - vraag PLEASE CONFIRM per item.",
    trigger: "Bij advancing aangemaakt voor festival show",
    subject: "Technical Advancing / {show_date} / {festival_name} / {artist_name} / {city}, {country}",
    body: `Hi {festival_contact_name},

My name is {pm_name}, Production Manager / Advancer for {artist_name}.
I would like to start the technical advancing for the show in the subject.

- Our latest Technical Rider is available in the advancing portal below.
- We would like to have a {programming_slot} program slot and {soundcheck_slot} soundcheck slot.
- Can you send us your latest technical spec list as confirmed per contract?

Please review and confirm each item in the portal:
{portal_link}

Categories to confirm:
- DJ Gear (mandatory)
- Monitors (mandatory)
- Audio
- Lighting
- Video
- Lasers
- SFX/Pyro
- Stage
- Ethernet
- Communication

Looking forward to your confirmation.

Best regards,
{pm_name}
{pm_phone}
{pm_email}`,
  },
  {
    key: "logistics_advancing",
    name: "Logistics advancing",
    description: "Naar festival voor crew, hotel, transport, distances en visa.",
    trigger: "Naast technical advancing - meestal kort daarna",
    subject: "Show Crew Logistics / {show_date} / {festival_name} / {artist_name} / {city}, {country}",
    body: `Hi {festival_contact_name},

TRAVEL B-PARTY ({crew_count} pax.):
{crew_list_with_roles}

TIMETABLE:
Can you please send the confirmed and most recent timetable?

CONTACTS:
Can you please send me the following contacts?
- Day of show contact name and number
- Transport contact name and number
- Production manager name and number

PAPERWORK/VISA:
Do we need extra paperwork or VISA requirements for this country/festival?

FLIGHT DETAILS:
{flight_info_or_pending_message}

HOTEL INFORMATION:
- Can you give me the {hotel_star}* Hotel options nearest to the venue?
- {hotel_rooms}
- {hotel_nights}
- Late checkout if needed

DISTANCES:
- Airport <> Hotel: KM/Minutes?
- Hotel <> Venue: KM/Minutes?
- Venue <> Airport: KM/Minutes?

Please fill in the details via the portal:
{portal_link}

Best regards,
{tm_name}`,
  },
  {
    key: "signed_rider_notification",
    name: "Signed rider notification",
    description: "Naar management bij upload getekende rider door festival.",
    trigger: "Wanneer festival rider getekend uploadt",
    subject: "Signed {rider_type} Rider / {festival_name} / {artist_name} / {show_date}",
    body: `Hi {management_contact},

{festival_name} has uploaded the signed {rider_type} rider for {artist_name} on {show_date}.

{festival_notes_if_any}

Review and accept/dispute in the portal:
{portal_link}

The signed rider has been synced to your Dropbox:
{dropbox_path}`,
  },
];

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Super-admin</div>
        <h2 className="text-xl font-extrabold text-ink-900 mt-1">E-mail templates</h2>
        <p className="text-sm text-ink-500 mt-1">
          Drie automatische templates uit spec v2. Tokens zoals <code className="font-mono text-xs bg-ink-100 px-1 rounded">{"{portal_link}"}</code> worden bij verzending vervangen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TEMPLATES.map((tpl) => (
          <article key={tpl.key} className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
            <header className="px-5 py-4 border-b border-ink-200 bg-ink-50">
              <h3 className="font-bold text-ink-900">{tpl.name}</h3>
              <p className="text-xs text-ink-500 mt-1">{tpl.description}</p>
              <p className="text-[11px] text-ink-400 mt-1">
                <span className="font-semibold text-ink-700">Trigger:</span> {tpl.trigger}
              </p>
            </header>
            <div className="px-5 py-4 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-1">Subject</div>
                <div className="text-sm font-mono text-ink-900 bg-ink-50 rounded-md px-3 py-2 border border-ink-200">
                  {tpl.subject}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-1">Body</div>
                <pre className="text-xs font-mono text-ink-700 bg-ink-50 rounded-md px-3 py-3 border border-ink-200 whitespace-pre-wrap">
{tpl.body}
                </pre>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
