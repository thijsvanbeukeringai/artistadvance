-- 034_booking_launches.sql
-- Wizard-state voor "Launch show" flow. Booking blijft draft tot finale commit;
-- wizard schrijft naar deze draft tabel zodat data niet halverwege verloren gaat
-- en de PM later kan hervatten.

CREATE TABLE IF NOT EXISTS booking_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  current_step smallint NOT NULL DEFAULT 1,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','committed','failed')),
  idempotency_key text UNIQUE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_launches_booking_id_idx ON booking_launches(booking_id);
CREATE INDEX IF NOT EXISTS booking_launches_status_idx ON booking_launches(status);

-- Audit log voor de wizard
CREATE TABLE IF NOT EXISTS booking_launch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  launch_id uuid REFERENCES booking_launches(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_launch_events_booking_idx
  ON booking_launch_events(booking_id, created_at DESC);

COMMENT ON TABLE booking_launches IS
  'Draft state voor de Launch-show wizard. Pas bij status=committed wordt confirmBooking gedraaid.';
COMMENT ON COLUMN booking_launches.state IS
  'Wizard payload: { selected_riders: text[], portal_prefill: {...}, mail: {subject, body, to[], cc[]} }';
