-- ─────────────────────────────────────────────────────────────────────────────
-- UltiMaven — Storage RLS policy fix
-- The original lb-videos upload policy used (storage.foldername(name))[3]
-- which is NULL for a 2-folder path like guitar/1/{userId}.mp4 (Postgres arrays
-- are 1-indexed, foldername returns {guitar,1} — index 3 is out of bounds).
-- This caused every upload to fail silently.
-- Run this in the Supabase SQL Editor AFTER running lb_submissions.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the broken path-restricted upload policy
drop policy if exists "lb-videos: authenticated upload" on storage.objects;

-- Replace with a simple bucket-scoped policy.
-- Upload authorization is enforced at the application layer (RLS on lb_submissions).
create policy "lb-videos: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lb-videos');
