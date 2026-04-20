-- ─────────────────────────────────────────────────────────────────────────────
-- UltiMaven — Supabase Schema + Row Level Security
-- Run this in the Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- One row per authenticated user; id mirrors auth.users.id

create table if not exists public.profiles (
  id                uuid        primary key references auth.users on delete cascade,
  full_name         text,
  email             text,
  avatar_url        text,
  is_pro            boolean     not null default false,
  pro_since         timestamptz,
  streak_count      integer     not null default 0,
  last_session_date date,
  total_xp          integer     not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);


-- ─── SKILL TRACKS ─────────────────────────────────────────────────────────────
-- One row per track the user has started.
-- track_key = the app's internal string ID ('guitar', 'finance', etc.)

create table if not exists public.skill_tracks (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null references public.profiles on delete cascade,
  track_key           text         not null,
  track_name          text         not null,
  track_emoji         text,
  total_lbs           integer      not null default 0,
  completed_lbs       integer      not null default 0,
  progress_percentage numeric(5,2) not null default 0,
  is_active           boolean      not null default true,
  started_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  unique (user_id, track_key)
);

alter table public.skill_tracks enable row level security;

create policy "skill_tracks: select own"
  on public.skill_tracks for select using (auth.uid() = user_id);

create policy "skill_tracks: insert own"
  on public.skill_tracks for insert with check (auth.uid() = user_id);

create policy "skill_tracks: update own"
  on public.skill_tracks for update using (auth.uid() = user_id);

create policy "skill_tracks: delete own"
  on public.skill_tracks for delete using (auth.uid() = user_id);


-- ─── LEARNING BLOCKS ──────────────────────────────────────────────────────────
-- One row per completed LB per user.
-- track_key mirrors the app track ID so we can query without joining skill_tracks.

create table if not exists public.learning_blocks (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles on delete cascade,
  track_id           uuid        references public.skill_tracks on delete set null,
  track_key          text        not null,
  lb_number          integer     not null,
  lb_title           text        not null,
  is_completed       boolean     not null default false,
  score              integer,
  time_spent_minutes integer,
  completed_at       timestamptz,
  unique (user_id, track_key, lb_number)
);

alter table public.learning_blocks enable row level security;

create policy "learning_blocks: select own"
  on public.learning_blocks for select using (auth.uid() = user_id);

create policy "learning_blocks: insert own"
  on public.learning_blocks for insert with check (auth.uid() = user_id);

create policy "learning_blocks: update own"
  on public.learning_blocks for update using (auth.uid() = user_id);

create policy "learning_blocks: delete own"
  on public.learning_blocks for delete using (auth.uid() = user_id);


-- ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

create table if not exists public.achievements (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles on delete cascade,
  achievement_type  text        not null,
  achievement_title text        not null,
  track_name        text,
  xp_earned         integer     not null default 0,
  earned_at         timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "achievements: select own"
  on public.achievements for select using (auth.uid() = user_id);

create policy "achievements: insert own"
  on public.achievements for insert with check (auth.uid() = user_id);


-- ─── BLAZE CONVERSATIONS ──────────────────────────────────────────────────────

create table if not exists public.blaze_conversations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles on delete cascade,
  message    text        not null,
  response   text        not null,
  created_at timestamptz not null default now()
);

alter table public.blaze_conversations enable row level security;

create policy "blaze_conversations: select own"
  on public.blaze_conversations for select using (auth.uid() = user_id);

create policy "blaze_conversations: insert own"
  on public.blaze_conversations for insert with check (auth.uid() = user_id);


-- ─── TRIGGER: auto-create profile on new auth user ───────────────────────────
-- Runs with security definer so it bypasses RLS.
-- Pulls full_name from the metadata passed in supabase.auth.signUp options.data

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, created_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── HELPER FUNCTION: increment XP atomically ─────────────────────────────────

create or replace function public.increment_xp(user_id_param uuid, xp_amount integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set total_xp = total_xp + xp_amount
  where id = user_id_param;
end;
$$;
