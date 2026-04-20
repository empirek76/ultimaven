-- ─────────────────────────────────────────────────────────────────────────────
-- UltiMaven — LB Submissions + Storage Setup
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── ADD is_admin TO PROFILES ─────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean not null default false;


-- ─── MIGRATE learning_blocks ──────────────────────────────────────────────────
-- Add video/creator columns to the existing learning_blocks table.

alter table public.learning_blocks
  add column if not exists video_path        text,
  add column if not exists thumbnail_path    text,
  add column if not exists duration_seconds  integer,
  add column if not exists creator_id        uuid references public.profiles(id) on delete set null;

create index if not exists learning_blocks_creator_id_idx
  on public.learning_blocks (creator_id);


-- ─── LB_SUBMISSIONS ───────────────────────────────────────────────────────────
-- Tracks user-submitted LB video content pending admin review.

create table if not exists public.lb_submissions (
  id               uuid        primary key default gen_random_uuid(),
  creator_id       uuid        not null references public.profiles(id) on delete cascade,
  track_id         text        not null,
  lb_number        integer     not null,
  lb_title         text        not null,
  lb_description   text,
  lb_outcome       text,
  video_path       text        not null,
  thumbnail_path   text,
  duration_seconds integer,
  status           text        not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  admin_notes      text,
  submitted_at     timestamptz not null default now(),
  reviewed_at      timestamptz
);

create index if not exists lb_submissions_creator_id_idx  on public.lb_submissions (creator_id);
create index if not exists lb_submissions_status_idx      on public.lb_submissions (status);
create index if not exists lb_submissions_track_lb_idx    on public.lb_submissions (track_id, lb_number);

alter table public.lb_submissions enable row level security;

-- Creators: insert own submissions
drop policy if exists "lb_submissions: insert own" on public.lb_submissions;
create policy "lb_submissions: insert own"
  on public.lb_submissions for insert
  with check (auth.uid() = creator_id);

-- Creators: read own submissions
drop policy if exists "lb_submissions: select own" on public.lb_submissions;
create policy "lb_submissions: select own"
  on public.lb_submissions for select
  using (auth.uid() = creator_id);

-- Admins: read all submissions
drop policy if exists "lb_submissions: admin select" on public.lb_submissions;
create policy "lb_submissions: admin select"
  on public.lb_submissions for select
  using (
    (select is_admin from public.profiles where id = auth.uid()) = true
  );

-- Admins: update status, admin_notes, reviewed_at
drop policy if exists "lb_submissions: admin update" on public.lb_submissions;
create policy "lb_submissions: admin update"
  on public.lb_submissions for update
  using (
    (select is_admin from public.profiles where id = auth.uid()) = true
  );

-- Public: read approved submissions (so the video player can find approved LBs)
drop policy if exists "lb_submissions: select approved" on public.lb_submissions;
create policy "lb_submissions: select approved"
  on public.lb_submissions for select
  using (status = 'approved');


-- ─── STORAGE RLS ──────────────────────────────────────────────────────────────
-- Run AFTER creating the buckets in the Supabase Storage dashboard.
-- Bucket names: 'lb-videos' (private), 'lb-thumbnails' (public)

-- lb-videos: authenticated users can upload to their own path
-- Path format: {trackId}/{lbNumber}/{userId}.mp4 → foldername[3] = userId
drop policy if exists "lb-videos: authenticated upload" on storage.objects;
create policy "lb-videos: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lb-videos'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

-- lb-videos: authenticated users can read their own files via signed URL
drop policy if exists "lb-videos: owner read" on storage.objects;
create policy "lb-videos: owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lb-videos'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

-- lb-videos: admins can read all videos
drop policy if exists "lb-videos: admin read" on storage.objects;
create policy "lb-videos: admin read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lb-videos'
    and (select is_admin from public.profiles where id = auth.uid()) = true
  );

-- lb-videos: admins can delete any video
drop policy if exists "lb-videos: admin delete" on storage.objects;
create policy "lb-videos: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lb-videos'
    and (select is_admin from public.profiles where id = auth.uid()) = true
  );

-- lb-thumbnails: authenticated users can upload thumbnails
drop policy if exists "lb-thumbnails: authenticated upload" on storage.objects;
create policy "lb-thumbnails: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lb-thumbnails');

-- lb-thumbnails: public read (bucket must also be set to public in dashboard)
drop policy if exists "lb-thumbnails: public read" on storage.objects;
create policy "lb-thumbnails: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'lb-thumbnails');

-- lb-thumbnails: admins can delete
drop policy if exists "lb-thumbnails: admin delete" on storage.objects;
create policy "lb-thumbnails: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lb-thumbnails'
    and (select is_admin from public.profiles where id = auth.uid()) = true
  );
