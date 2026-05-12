"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/bookings": "Bookings",
  "/advancings": "Advancings",
  "/artists": "Artists",
  "/festivals": "Festivals",
  "/riders": "Signed Riders",
  "/files": "File Management",
  "/activity": "Activity Log",
  "/team": "Team",
  "/tracker": "Production Tracker",
  "/admin": "Super-admin",
  "/help": "Help",
  "/settings": "Settings",
};

export default function TopbarTitle() {
  const pathname = usePathname() || "/";
  const root = "/" + (pathname.split("/")[1] || "");
  const title = titles[root] ?? "ArtistAdvance";
  return <h1 className="text-lg lg:text-2xl font-extrabold tracking-tight text-ink-900 truncate">{title}</h1>;
}
