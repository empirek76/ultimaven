-- ─────────────────────────────────────────────────────────────────────────────
-- UltiMaven — Grant admin access
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- Add is_admin column to profiles (if not already present from lb_submissions.sql)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Grant admin to your account
update public.profiles
  set is_admin = true
  where email = 'empirek@gmail.com';

-- Verify
select id, email, is_admin from public.profiles where email = 'empirek@gmail.com';
