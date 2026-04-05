-- Run this in Supabase SQL Editor if signup fails with:
-- "Database error creating new user" or "Database error saving new user"
--
-- It repairs the common auth.users -> public.profiles trigger mismatch.

create table if not exists public.profiles (
  user_id uuid primary key,
  display_name text,
  role text default 'user' check (role in ('user','partner','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Explorer'
    ),
    coalesce(new.raw_app_meta_data->>'role', 'user')
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        role = coalesce(public.profiles.role, excluded.role),
        updated_at = now();

  return new;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Explorer'
    ),
    coalesce(new.raw_app_meta_data->>'role', 'user')
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        role = coalesce(public.profiles.role, excluded.role),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
