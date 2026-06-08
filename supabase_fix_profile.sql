-- =====================================================================
-- XayFind — Fix: backfill missing profile rows + make yourself admin
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

-- 1. Make sure the auto-create-profile trigger exists (safe to re-run)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Backfill a profile for every existing user who doesn't have one yet
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, u.raw_user_meta_data->>'full_name', 'user'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 3. Make sure you can read your own profile from the app
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using ( auth.uid() = id );

-- 4. Promote yourself to admin
update public.profiles set role = 'admin' where email = 'emmyoyebade@gmail.com';

-- 5. Verify -- this should now return your row with role = admin
select id, email, role from public.profiles;
