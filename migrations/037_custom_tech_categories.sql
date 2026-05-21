-- 037_custom_tech_categories.sql
-- Custom tech-categorieën per artist. We droppen de hard-coded check constraint
-- en valideren in app-laag. Daarnaast een tabel met artist-specifieke labels
-- zodat de UI de namen kent.

ALTER TABLE advancing_tech_items
  DROP CONSTRAINT IF EXISTS advancing_tech_items_category_check;

ALTER TABLE artist_tech_requirements
  DROP CONSTRAINT IF EXISTS artist_tech_requirements_category_check;

CREATE TABLE IF NOT EXISTS artist_custom_tech_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, key)
);

CREATE INDEX IF NOT EXISTS artist_custom_tech_categories_artist_idx
  ON artist_custom_tech_categories(artist_id);

COMMENT ON TABLE artist_custom_tech_categories IS
  'Per-artist custom categorieen bovenop de built-in 12 (dj_gear/monitors/...). key is opgeslagen in advancing_tech_items.category.';
