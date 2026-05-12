"use client";

import { useState, useEffect } from "react";

export default function FestivalSearchClient() {
  const [q, setQ] = useState("");

  useEffect(() => {
    const term = q.trim().toLowerCase();
    const sections = document.querySelectorAll<HTMLElement>("[data-festival-name]");
    let visible = 0;
    sections.forEach((s) => {
      const name = (s.dataset.festivalName ?? "").toLowerCase();
      const contacts = (s.dataset.festivalContacts ?? "").toLowerCase();
      const match = !term || name.includes(term) || contacts.includes(term);
      s.style.display = match ? "" : "none";
      if (match) visible++;
    });
    const counter = document.getElementById("festival-search-counter");
    if (counter) counter.textContent = term ? `${visible} match` : "";
  }, [q]);

  return (
    <div className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek festival of contact-naam..."
        className="w-full md:w-80 pl-8 pr-3 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
      />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <span id="festival-search-counter" className="ml-3 text-[11px] text-ink-500 tabular-nums"></span>
    </div>
  );
}
