-- =====================================================================
-- XayFind — Supabase Auth setup
-- Run this whole file ONCE in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE  (one row per user, holds their role)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'user' check (role in ('admin','vendor','user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each logged-in user can read ONLY their own profile row.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- NOTE: we intentionally do NOT add an UPDATE policy here.
-- That means users cannot change their own role to 'admin' from the app.
-- Roles are changed only by you in the SQL editor (see step 4 below).

-- ---------------------------------------------------------------------
-- 2. AUTO-CREATE A PROFILE WHEN SOMEONE SIGNS UP
--    (so you never have to insert profile rows by hand)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. SAVED_SPOTS TABLE  (which user saved which spot)
-- ---------------------------------------------------------------------
create table if not exists public.saved_spots (
  id         bigint generated always as identity primary key,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  spot_id    bigint not null references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

alter table public.saved_spots enable row level security;

-- A user can only see / add / remove THEIR OWN saved spots.
drop policy if exists "read own saved" on public.saved_spots;
create policy "read own saved"
  on public.saved_spots for select using ( auth.uid() = user_id );

drop policy if exists "insert own saved" on public.saved_spots;
create policy "insert own saved"
  on public.saved_spots for insert with check ( auth.uid() = user_id );

drop policy if exists "delete own saved" on public.saved_spots;
create policy "delete own saved"
  on public.saved_spots for delete using ( auth.uid() = user_id );

-- ---------------------------------------------------------------------
-- 4. MAKE YOUR OWN ACCOUNT AN ADMIN
--    Do this AFTER you have signed up once with this email in the app.
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin' where email = 'adedejiemmanuel18@gmail.com';

-- To make someone a vendor instead:
-- update public.profiles set role = 'vendor' where email = 'their@email.com';
