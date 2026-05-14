-- 033_festival_docs_any_mime.sql
-- Festival portal uploads kunnen van alle types zijn (Resolume XML, GrandMA
-- showfile, ArchiCAD, ZIP, CSV, XLSX, Pangolin, etc). PDF-only is te streng.
-- Riders + rider-templates blijven PDF/images (gericht document-formaat).

UPDATE storage.buckets
   SET allowed_mime_types = NULL,
       file_size_limit = 50 * 1024 * 1024
 WHERE id = 'festival-documents';
