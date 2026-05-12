-- 030_festival_portal_visibility.sql
-- Voegt per advancing een array toe van section-keys die in het festival
-- portal verborgen moeten worden. Standaard '{}' = alles tonen.
-- Mogelijke keys: tech, hotel, distances, travel, documents, riders, program

ALTER TABLE advancings
  ADD COLUMN IF NOT EXISTS festival_portal_hidden TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN advancings.festival_portal_hidden IS
  'Section-keys die in /festival/<token> verborgen moeten worden. Leeg = alles zichtbaar.';
