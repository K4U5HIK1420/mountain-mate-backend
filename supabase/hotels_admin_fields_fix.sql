alter table public.hotels add column if not exists compliance_details jsonb default '{}'::jsonb;
alter table public.hotels add column if not exists verification_documents jsonb default '{}'::jsonb;
alter table public.hotels add column if not exists property_type text default 'Hotel';
alter table public.hotels add column if not exists landmark text default '';
alter table public.hotels add column if not exists owner_name text default '';
alter table public.hotels add column if not exists guests_per_room integer not null default 2;
alter table public.hotels add column if not exists availability_status text default 'Available now';
alter table public.hotels drop constraint if exists hotels_property_type_check;
alter table public.hotels
  add constraint hotels_property_type_check
  check (property_type in ('Hotel', 'Homestay', 'Lodge', 'Camp / Tent'));
