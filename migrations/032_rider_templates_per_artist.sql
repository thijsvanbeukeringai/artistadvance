-- 032_rider_templates_per_artist.sql
-- Rider templates worden per artist beheerd (niet per show_type). Per booking
-- kies je welke riders mee moeten naar het festival portal.

-- 1) Drop oude unique-constraint op (artist_id, show_type, rider_type)
ALTER TABLE artist_rider_templates
  DROP CONSTRAINT IF EXISTS artist_rider_templates_artist_id_show_type_rider_type_key;

-- show_type behouden voor back-compat oude rijen, maar nullable
ALTER TABLE artist_rider_templates
  ALTER COLUMN show_type DROP NOT NULL;

-- 2) Nieuwe unique: één rider per (artist, rider_type) waar show_type leeg is
-- (partial unique zodat oude show_type-gebonden rijen niet breken)
CREATE UNIQUE INDEX IF NOT EXISTS artist_rider_templates_artist_rider_type_idx
  ON artist_rider_templates (artist_id, rider_type)
  WHERE show_type IS NULL;

-- 3) Per-booking selectie welke riders mee moeten naar het festival
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS selected_riders text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN bookings.selected_riders IS
  'rider_type keys (technical, hospitality, production, bus, rigging, stage, club, festival, dressingroom, sfx_pyro) die in dit show meegestuurd worden naar het festival portal.';
