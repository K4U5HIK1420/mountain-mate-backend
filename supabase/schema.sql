-- Mountain Mates: initial Supabase Postgres schema
-- Apply in Supabase SQL editor.

-- Extensions
create extension if not exists pgcrypto;

-- Hotels
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- Supabase auth.users.id

  hotel_name text not null,
  location text not null,
  price_per_night integer not null,
  rooms_available integer not null,
  contact_number text not null,
  description text default '',
  distance text default '0',
  images text[] default '{}',
  amenities jsonb default '[]'::jsonb,

  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_verified boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hotels add column if not exists compliance_details jsonb default '{}'::jsonb;
alter table public.hotels add column if not exists verification_documents jsonb default '{}'::jsonb;

create index if not exists hotels_owner_id_idx on public.hotels(owner_id);
create index if not exists hotels_location_idx on public.hotels(location);
create index if not exists hotels_verified_idx on public.hotels(is_verified);
create index if not exists hotels_status_idx on public.hotels(status);

-- Transports
create table if not exists public.transports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,

  vehicle_model text not null,
  vehicle_type text not null,
  plate_number text not null unique,
  driver_name text not null,
  contact_number text not null,

  route_from text not null,
  route_to text not null,
  from_coords jsonb,
  to_coords jsonb,

  price_per_seat integer not null,
  seats_available integer not null,
  images text[] not null default '{}',

  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_verified boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transports add column if not exists compliance_details jsonb default '{}'::jsonb;
alter table public.transports add column if not exists verification_documents jsonb default '{}'::jsonb;

create index if not exists transports_owner_id_idx on public.transports(owner_id);
create index if not exists transports_route_idx on public.transports(route_from, route_to);
create index if not exists transports_verified_idx on public.transports(is_verified);
create index if not exists transports_status_idx on public.transports(status);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_hotels_updated_at on public.hotels;
create trigger set_hotels_updated_at
before update on public.hotels
for each row execute function public.set_updated_at();

drop trigger if exists set_transports_updated_at on public.transports;
create trigger set_transports_updated_at
before update on public.transports
for each row execute function public.set_updated_at();

-- RLS (recommended). Keep disabled until you add policies.
-- alter table public.hotels enable row level security;
-- alter table public.transports enable row level security;

-- Profiles (optional app-level user data linked to Supabase Auth)
create table if not exists public.profiles (
  user_id uuid primary key, -- auth.users.id
  display_name text,
  role text default 'user' check (role in ('user','partner','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Bookings (store legacy Mongo references too)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  customer_name text not null,
  phone_number text not null,
  booking_type text not null check (booking_type in ('Transport','Hotel')),

  -- During migration we may not have a Supabase UUID listing id yet.
  listing_mongo_id text,
  listing_supabase_id uuid,

  date date not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),

  payment_id text,
  order_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_type_idx on public.bookings(booking_type);
create index if not exists bookings_listing_mongo_idx on public.bookings(listing_mongo_id);
create index if not exists bookings_listing_supabase_idx on public.bookings(listing_supabase_id);

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Reviews (store legacy Mongo hotel id as well)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),

  hotel_mongo_id text,
  hotel_supabase_id uuid,

  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_hotel_mongo_idx on public.reviews(hotel_mongo_id);
create index if not exists reviews_hotel_supabase_idx on public.reviews(hotel_supabase_id);

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Support conversations (AI + admin handoff)
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text default '',
  guest_label text default 'Explorer',
  status text not null default 'queued' check (status in ('ai_resolved','queued','open','resolved')),
  handoff_reason text default '',
  last_user_message text default '',
  last_admin_message text default '',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_conversations_status_idx on public.support_conversations(status);
create index if not exists support_conversations_updated_idx on public.support_conversations(updated_at desc);
create index if not exists support_conversations_user_id_idx on public.support_conversations(user_id);

drop trigger if exists set_support_conversations_updated_at on public.support_conversations;
create trigger set_support_conversations_updated_at
before update on public.support_conversations
for each row execute function public.set_updated_at();

