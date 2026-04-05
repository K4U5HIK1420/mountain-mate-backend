-- Run this in Supabase SQL Editor if booking/payment pages show Rs 0
-- or if manual UPI / Razorpay flows lose the booking total.

alter table public.bookings add column if not exists user_id uuid;
alter table public.bookings add column if not exists owner_id uuid;
alter table public.bookings add column if not exists listing_label text default '';
alter table public.bookings add column if not exists start_date date;
alter table public.bookings add column if not exists end_date date;
alter table public.bookings add column if not exists guests integer not null default 1;
alter table public.bookings add column if not exists rooms integer not null default 1;
alter table public.bookings add column if not exists amount integer not null default 0;
alter table public.bookings add column if not exists currency text not null default 'INR';
alter table public.bookings add column if not exists live_tracking jsonb;
alter table public.bookings add column if not exists manual_payment jsonb;

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_owner_id_idx on public.bookings(owner_id);

