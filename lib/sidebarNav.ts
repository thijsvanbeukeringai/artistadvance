import { canAccessAdvancing, type AccountContext } from "./account";
import type { SidebarGroup } from "@/components/SidebarNav";

const ICON = {
  dashboard: "M3 12l9-9 9 9M5 10v10h14V10",
  calendar: "M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z M7 14h2v2H7z M11 14h2v2h-2z M15 14h2v2h-2z",
  bookings: "M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  festival: "M3 21h18 M5 21V7l7-4 7 4v14 M9 12h6 M9 17h6",
  riders: "M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  activity: "M3 12h4l3-9 4 18 3-9h4",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8z M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  advancings: "M4 4h12l4 4v12H4z M16 4v4h4",
  tracker: "M3 3h18v4H3z M3 11h18v4H3z M3 19h18v4H3z",
  financial: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
};

export function buildNavGroups(account: AccountContext): SidebarGroup[] {
  const isArtist = account.mode === "artist";
  const artistId = account.artistId;
  const hasAdvancing = canAccessAdvancing(account.role);

  const artistNav = isArtist && artistId
    ? [
        { href: "/", label: "Dashboard", iconPath: ICON.dashboard },
        { href: `/artists/${artistId}/calendar`, label: "Kalender", iconPath: ICON.calendar },
        { href: "/bookings", label: "Shows", iconPath: ICON.bookings },
        { href: `/artists/${artistId}/settings`, label: "Artist settings", iconPath: ICON.settings },
        { href: "/riders", label: "Signed Riders", iconPath: ICON.riders },
      ]
    : [
        { href: "/", label: "Dashboard", iconPath: ICON.dashboard },
        { href: "/calendar", label: "Kalender", iconPath: ICON.calendar },
        { href: "/bookings", label: "Boekingen", iconPath: ICON.bookings },
        { href: "/festivals", label: "Festivals CRM", iconPath: ICON.festival },
        { href: "/financial", label: "Financieel", iconPath: ICON.financial },
        { href: "/riders", label: "Signed Riders", iconPath: ICON.riders },
      ];

  const groups: SidebarGroup[] = [
    {
      section: isArtist ? `ARTIST · ${account.label.toUpperCase()}` : "BOOKINGS AGENCY",
      items: artistNav,
    },
  ];

  if (hasAdvancing) {
    groups.push({
      section: "ADVANCING TEAM",
      items: [
        { href: "/advancings", label: "Advancings", iconPath: ICON.advancings },
        { href: "/tracker", label: "Production Tracker", iconPath: ICON.tracker },
      ],
    });
  }

  if (account.role === "super_admin") {
    groups.push({
      section: "SUPER-ADMIN",
      accent: true,
      items: [
        { href: "/admin/companies", label: "Bedrijven & artiesten", iconPath: "M3 21V8l9-5 9 5v13 M9 21V12h6v9" },
        { href: "/admin/email-templates", label: "E-mail templates", iconPath: "M4 4h16v16H4z M4 4l8 8 8-8" },
      ],
    });
  }

  groups.push({
    section: "SUPPORT",
    items: [
      ...(account.role === "super_admin" || account.role === "agency_admin"
        ? [{ href: "/billing", label: "Billing", iconPath: "M2 3h20v14H2z M2 9h20 M8 13h4" }]
        : []),
      { href: "/help", label: "Help", iconPath: "M12 18h.01 M9.09 9a3 3 0 115.83 1c0 2-3 3-3 3" },
      { href: "/settings", label: "Settings", iconPath: ICON.settings },
    ],
  });

  return groups;
}
