create extension if not exists pgcrypto;

create table if not exists public.hotel_room_inventory (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null,
  room_type text not null default 'Standard',
  stay_date date not null,
  total_rooms integer not null default 0 check (total_rooms >= 0),
  booked_rooms integer not null default 0 check (booked_rooms >= 0),
  price numeric(12,2) not null default 0 check (price >= 0),
  is_sold_out boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists hotel_room_inventory_hotel_room_date_idx
  on public.hotel_room_inventory (hotel_id, room_type, stay_date);

create index if not exists hotel_room_inventory_hotel_date_idx
  on public.hotel_room_inventory (hotel_id, stay_date);

create or replace function public.set_updated_at_hotel_room_inventory()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_hotel_room_inventory_updated_at on public.hotel_room_inventory;
create trigger trg_hotel_room_inventory_updated_at
before update on public.hotel_room_inventory
for each row
execute function public.set_updated_at_hotel_room_inventory();

create or replace function public.reserve_hotel_inventory(
  p_hotel_id text,
  p_room_type text,
  p_start_date date,
  p_end_date date,
  p_rooms integer,
  p_default_total_rooms integer,
  p_default_price numeric
)
returns jsonb
language plpgsql
as $$
declare
  v_day date;
  v_available integer;
  v_row record;
begin
  if p_hotel_id is null or btrim(p_hotel_id) = '' then
    raise exception 'hotelId is required.';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'Invalid stay dates.';
  end if;

  if coalesce(p_rooms, 0) < 1 then
    raise exception 'At least one room is required.';
  end if;

  insert into public.hotel_room_inventory (
    hotel_id,
    room_type,
    stay_date,
    total_rooms,
    booked_rooms,
    price,
    is_sold_out
  )
  select
    p_hotel_id,
    coalesce(nullif(p_room_type, ''), 'Standard'),
    gs::date,
    greatest(coalesce(p_default_total_rooms, 0), 0),
    0,
    greatest(coalesce(p_default_price, 0), 0),
    greatest(coalesce(p_default_total_rooms, 0), 0) <= 0
  from generate_series(p_start_date, p_end_date - interval '1 day', interval '1 day') as gs
  on conflict (hotel_id, room_type, stay_date) do nothing;

  for v_row in
    select *
    from public.hotel_room_inventory
    where hotel_id = p_hotel_id
      and room_type = coalesce(nullif(p_room_type, ''), 'Standard')
      and stay_date >= p_start_date
      and stay_date < p_end_date
    order by stay_date
    for update
  loop
    v_available := greatest(coalesce(v_row.total_rooms, 0) - coalesce(v_row.booked_rooms, 0), 0);
    if coalesce(v_row.is_sold_out, false) or v_available < p_rooms then
      raise exception 'No rooms available on %.', to_char(v_row.stay_date, 'YYYY-MM-DD');
    end if;
  end loop;

  update public.hotel_room_inventory
  set
    booked_rooms = booked_rooms + p_rooms,
    is_sold_out = (booked_rooms + p_rooms) >= total_rooms
  where hotel_id = p_hotel_id
    and room_type = coalesce(nullif(p_room_type, ''), 'Standard')
    and stay_date >= p_start_date
    and stay_date < p_end_date;

  return jsonb_build_object(
    'success', true,
    'nights', greatest((p_end_date - p_start_date), 0),
    'rooms', p_rooms
  );
end;
$$;

create or replace function public.release_hotel_inventory(
  p_hotel_id text,
  p_room_type text,
  p_start_date date,
  p_end_date date,
  p_rooms integer,
  p_default_total_rooms integer,
  p_default_price numeric
)
returns jsonb
language plpgsql
as $$
begin
  if p_hotel_id is null or btrim(p_hotel_id) = '' then
    raise exception 'hotelId is required.';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    return jsonb_build_object('success', true, 'released', 0);
  end if;

  insert into public.hotel_room_inventory (
    hotel_id,
    room_type,
    stay_date,
    total_rooms,
    booked_rooms,
    price,
    is_sold_out
  )
  select
    p_hotel_id,
    coalesce(nullif(p_room_type, ''), 'Standard'),
    gs::date,
    greatest(coalesce(p_default_total_rooms, 0), 0),
    0,
    greatest(coalesce(p_default_price, 0), 0),
    greatest(coalesce(p_default_total_rooms, 0), 0) <= 0
  from generate_series(p_start_date, p_end_date - interval '1 day', interval '1 day') as gs
  on conflict (hotel_id, room_type, stay_date) do nothing;

  update public.hotel_room_inventory
  set
    booked_rooms = greatest(booked_rooms - greatest(coalesce(p_rooms, 0), 0), 0),
    is_sold_out = false
  where hotel_id = p_hotel_id
    and room_type = coalesce(nullif(p_room_type, ''), 'Standard')
    and stay_date >= p_start_date
    and stay_date < p_end_date;

  update public.hotel_room_inventory
  set is_sold_out = booked_rooms >= total_rooms
  where hotel_id = p_hotel_id
    and room_type = coalesce(nullif(p_room_type, ''), 'Standard')
    and stay_date >= p_start_date
    and stay_date < p_end_date;

  return jsonb_build_object(
    'success', true,
    'released', greatest((p_end_date - p_start_date), 0)
  );
end;
$$;
