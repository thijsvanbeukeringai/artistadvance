-- 035_artist_solo_mode.sql
-- Artist-only mode: een solo-artist zonder boekingskantoor kan zelf shows
-- aanmaken voor advancing. Geen aparte tabel — één code-pad met een vlag
-- op bookings die agency-velden in de UI verbergt.

-- 1) Booking-vlag: deze show is artist-self-advanced (geen agency-deal)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS advance_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN bookings.advance_only IS
  'TRUE = booking is door artist zelf aangemaakt voor advancing (geen agency-flow). Verbergt commission/holds/contract velden in UI.';

-- 2) Organization-type uitbreiden met "artist_solo"
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_type_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_type_check
  CHECK (type IN ('management', 'festival', 'artist_solo'));

COMMENT ON COLUMN organizations.type IS
  'management = booking-agency, festival = promoter, artist_solo = self-managed artist (1 persoon, geen agency).';

-- 3) Voor solo-artists is veel agency-data optioneel. Bestaande velden zijn
-- al nullable; advance_only=true shows mogen die velden gewoon leeg laten.
