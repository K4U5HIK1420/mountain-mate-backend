create extension if not exists pgcrypto;

alter table if exists public.transports
  add column if not exists ride_mode text not null default 'car_pooling',
  add column if not exists service_label text not null default 'Car Pooling';

create table if not exists public.shared_taxi_rides (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  vehicle_model text not null default '',
  vehicle_type text not null default 'Shared Taxi',
  plate_number text not null default '',
  driver_name text not null default '',
  contact_number text not null default '',
  route_from text not null,
  route_to text not null,
  available_date timestamptz,
  from_coords jsonb,
  to_coords jsonb,
  price_per_seat numeric(12,2) not null default 0 check (price_per_seat >= 0),
  total_seats integer not null default 1 check (total_seats >= 1),
  booked_seats integer not null default 0 check (booked_seats >= 0),
  driver_online boolean not null default true,
  images text[] not null default '{}',
  compliance_details jsonb not null default '{}'::jsonb,
  verification_documents jsonb not null default '{}'::jsonb,
  status text not null default 'approved',
  is_verified boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists shared_taxi_rides_owner_idx
  on public.shared_taxi_rides (owner_id);

create index if not exists shared_taxi_rides_route_idx
  on public.shared_taxi_rides (route_from, route_to);

create index if not exists shared_taxi_rides_status_idx
  on public.shared_taxi_rides (status, driver_online);

create table if not exists public.taxi_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  driver_id text,
  source_transport_id text,
  customer_name text not null default '',
  customer_phone text not null default '',
  pickup_location text not null,
  drop_location text not null,
  pickup_coords jsonb,
  drop_coords jsonb,
  scheduled_for timestamptz not null,
  distance_km numeric(12,2) not null default 0 check (distance_km >= 0),
  estimated_fare numeric(12,2) not null default 0 check (estimated_fare >= 0),
  status text not null default 'pending',
  assignment_meta jsonb not null default '{}'::jsonb,
  pricing_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists taxi_bookings_user_idx
  on public.taxi_bookings (user_id, created_at desc);

create index if not exists taxi_bookings_driver_idx
  on public.taxi_bookings (driver_id, created_at desc);

create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_shared_taxi_rides_updated_at on public.shared_taxi_rides;
create trigger trg_shared_taxi_rides_updated_at
before update on public.shared_taxi_rides
for each row
execute function public.set_updated_at_generic();

drop trigger if exists trg_taxi_bookings_updated_at on public.taxi_bookings;
create trigger trg_taxi_bookings_updated_at
before update on public.taxi_bookings
for each row
execute function public.set_updated_at_generic();

create or replace function public.reserve_shared_taxi_seats(
  p_ride_id uuid,
  p_requested_seats integer
)
returns jsonb
language plpgsql
as $$
declare
  v_row public.shared_taxi_rides%rowtype;
  v_remaining integer;
begin
  if p_ride_id is null then
    raise exception 'rideId is required.';
  end if;

  if coalesce(p_requested_seats, 0) < 1 then
    raise exception 'At least one seat is required.';
  end if;

  select *
  into v_row
  from public.shared_taxi_rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Shared taxi ride not found.';
  end if;

  if v_row.status <> 'approved' or coalesce(v_row.driver_online, true) = false then
    raise exception 'This shared taxi is not bookable right now.';
  end if;

  v_remaining := greatest(coalesce(v_row.total_seats, 0) - coalesce(v_row.booked_seats, 0), 0);
  if v_remaining < p_requested_seats then
    raise exception 'Only % seats left.', v_remaining;
  end if;

  update public.shared_taxi_rides
  set booked_seats = booked_seats + p_requested_seats
  where id = p_ride_id;

  return jsonb_build_object(
    'success', true,
    'bookedSeats', v_row.booked_seats + p_requested_seats,
    'remainingSeats', greatest(v_row.total_seats - (v_row.booked_seats + p_requested_seats), 0)
  );
end;
$$;

create or replace function public.release_shared_taxi_seats(
  p_ride_id uuid,
  p_released_seats integer
)
returns jsonb
language plpgsql
as $$
declare
  v_row public.shared_taxi_rides%rowtype;
begin
  if p_ride_id is null then
    raise exception 'rideId is required.';
  end if;

  if coalesce(p_released_seats, 0) < 1 then
    return jsonb_build_object('success', true, 'remainingSeats', null);
  end if;

  select *
  into v_row
  from public.shared_taxi_rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Shared taxi ride not found.';
  end if;

  update public.shared_taxi_rides
  set booked_seats = greatest(booked_seats - p_released_seats, 0)
  where id = p_ride_id;

  return jsonb_build_object(
    'success', true,
    'remainingSeats', greatest(v_row.total_seats - greatest(v_row.booked_seats - p_released_seats, 0), 0)
  );
end;
$$;
