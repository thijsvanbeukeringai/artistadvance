-- 036_intake_links.sql
-- Publieke intake-link per artist: promoters vullen show-detail in zonder login.
-- Artist accepteert daarna → seed booking met advance_only=true.

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS intake_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS intake_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN artists.intake_slug IS
  'Slug voor de publieke intake-URL: /intake/<slug>. NULL = niet ingeschakeld.';

-- Inkomende booking-aanvragen via de intake-link (nog niet geaccepteerd)
CREATE TABLE IF NOT EXISTS booking_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  -- Show details (van promoter)
  festival_name text NOT NULL,
  stage_name text,
  show_date date NOT NULL,
  show_time time,
  set_duration_minutes int,
  show_type text,
  venue_city text,
  venue_country text,
  fee numeric,
  -- Promoter contact
  promoter_name text NOT NULL,
  promoter_email text NOT NULL,
  promoter_phone text,
  promoter_company text,
  notes text,
  -- Audit
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  converted_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS booking_intakes_artist_idx ON booking_intakes(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_intakes_status_idx ON booking_intakes(status);

COMMENT ON TABLE booking_intakes IS
  'Inkomende show-aanvragen via publieke /intake/<slug>. Artist accepteert → wordt booking met advance_only=true.';
