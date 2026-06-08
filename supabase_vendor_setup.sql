-- =====================================================================
-- XayFind — Vendor ownership setup
-- Run this AFTER supabase_auth_setup.sql, in: SQL Editor → New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ADD AN OWNER COLUMN TO SPOTS
--    Links a spot to the vendor's auth account.
-- ---------------------------------------------------------------------
alter table public.spots
  add column if not exists vendor_id uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------
-- 2. LET ADMINS READ THE LIST OF ACCOUNTS
--    Needed so the admin panel's "Owner account" dropdown can list
--    everyone. We use a SECURITY DEFINER helper to avoid the classic
--    "infinite recursion in policy" error you'd get by querying
--    profiles from inside a profiles policy.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
  on public.profiles for select
  using ( public.is_admin() );

-- Done. No changes to the spots table's read/write policies, so the
-- public review feature keeps working exactly as before.
