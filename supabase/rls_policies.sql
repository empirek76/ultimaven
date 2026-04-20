-- ─────────────────────────────────────────────────────────────────────────────
-- UltiMaven — Row Level Security Policies (idempotent)
-- Run after schema.sql to reset or apply RLS policies from scratch.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── PROFILES ─────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;

create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);


-- ─── SKILL TRACKS ─────────────────────────────────────────────────────────────

alter table public.skill_tracks enable row level security;

drop policy if exists "skill_tracks: select own" on public.skill_tracks;
drop policy if exists "skill_tracks: insert own" on public.skill_tracks;
drop policy if exists "skill_tracks: update own" on public.skill_tracks;
drop policy if exists "skill_tracks: delete own" on public.skill_tracks;

create policy "skill_tracks: select own"
  on public.skill_tracks for select using (auth.uid() = user_id);

create policy "skill_tracks: insert own"
  on public.skill_tracks for insert with check (auth.uid() = user_id);

create policy "skill_tracks: update own"
  on public.skill_tracks for update using (auth.uid() = user_id);

create policy "skill_tracks: delete own"
  on public.skill_tracks for delete using (auth.uid() = user_id);


-- ─── LEARNING BLOCKS ──────────────────────────────────────────────────────────

alter table public.learning_blocks enable row level security;

drop policy if exists "learning_blocks: select own" on public.learning_blocks;
drop policy if exists "learning_blocks: insert own" on public.learning_blocks;
drop policy if exists "learning_blocks: update own" on public.learning_blocks;
drop policy if exists "learning_blocks: delete own" on public.learning_blocks;

create policy "learning_blocks: select own"
  on public.learning_blocks for select using (auth.uid() = user_id);

create policy "learning_blocks: insert own"
  on public.learning_blocks for insert with check (auth.uid() = user_id);

create policy "learning_blocks: update own"
  on public.learning_blocks for update using (auth.uid() = user_id);

create policy "learning_blocks: delete own"
  on public.learning_blocks for delete using (auth.uid() = user_id);


-- ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

alter table public.achievements enable row level security;

drop policy if exists "achievements: select own" on public.achievements;
drop policy if exists "achievements: insert own" on public.achievements;

create policy "achievements: select own"
  on public.achievements for select using (auth.uid() = user_id);

create policy "achievements: insert own"
  on public.achievements for insert with check (auth.uid() = user_id);


-- ─── BLAZE CONVERSATIONS ──────────────────────────────────────────────────────

alter table public.blaze_conversations enable row level security;

drop policy if exists "blaze_conversations: select own" on public.blaze_conversations;
drop policy if exists "blaze_conversations: insert own" on public.blaze_conversations;

create policy "blaze_conversations: select own"
  on public.blaze_conversations for select using (auth.uid() = user_id);

create policy "blaze_conversations: insert own"
  on public.blaze_conversations for insert with check (auth.uid() = user_id);
