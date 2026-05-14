-- 031_dropbox_per_artist.sql
-- Dropbox-koppeling per artiest (OAuth tokens + root-map) en sync-velden
-- op festival_documents zodat het festival-portal automatisch uploads
-- doorzet naar /{artist}/{show - datum - stad}/{NN_CATEGORY}/ in Dropbox.

-- 1) Tokens per artiest. Bewust per artist (niet per organization) want
-- een management agency kan meerdere Dropbox-accounts gebruiken, en sommige
-- artiesten leveren hun eigen Dropbox aan.
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS dropbox_access_token text,
  ADD COLUMN IF NOT EXISTS dropbox_refresh_token text,
  ADD COLUMN IF NOT EXISTS dropbox_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS dropbox_account_email text;

COMMENT ON COLUMN artists.dropbox_access_token IS
  'Short-lived OAuth access token. Vervalt; ververst via refresh_token.';
COMMENT ON COLUMN artists.dropbox_refresh_token IS
  'Long-lived refresh token. Aanwezigheid = artiest "Dropbox connected".';
COMMENT ON COLUMN artists.dropbox_artist_folder IS
  'Pad in de gekoppelde Dropbox-account waaronder shows worden aangemaakt. Bv. "/Afrojack". Leeg = root.';

-- 2) Show-folder pad op advancing (al gemodelleerd in types, kolom zeker stellen)
ALTER TABLE advancings
  ADD COLUMN IF NOT EXISTS dropbox_show_folder text;

COMMENT ON COLUMN advancings.dropbox_show_folder IS
  'Pad naar de show-map in Dropbox, relatief aan artist root. Bv. "/Tomorrowland - 2026-07-19 - Boom".';

-- 3) Sync-metadata per festival document
ALTER TABLE festival_documents
  ADD COLUMN IF NOT EXISTS dropbox_path text,
  ADD COLUMN IF NOT EXISTS dropbox_file_id text,
  ADD COLUMN IF NOT EXISTS synced_to_dropbox boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dropbox_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS dropbox_error text;

COMMENT ON COLUMN festival_documents.dropbox_path IS
  'Volledig Dropbox-pad waar het bestand staat na sync. NULL als nog niet gesynct.';
COMMENT ON COLUMN festival_documents.dropbox_error IS
  'Laatste sync-fout. NULL = geen probleem. Wordt door retry-actie gewist.';

-- 4) OAuth state cookie ondersteuning: niet nodig in DB, gebeurt via httpOnly cookie.
