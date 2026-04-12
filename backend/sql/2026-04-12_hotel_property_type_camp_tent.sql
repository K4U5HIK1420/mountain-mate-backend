alter table public.hotels drop constraint if exists hotels_property_type_check;
alter table public.hotels
  add constraint hotels_property_type_check
  check (property_type in ('Hotel', 'Homestay', 'Lodge', 'Camp / Tent'));
