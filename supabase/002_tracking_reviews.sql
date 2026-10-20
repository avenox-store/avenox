-- Run after schema.sql. Adds shipment tracking and moderated reviews with photos.

-- ---------- Tracking -------------------------------------------------
alter type order_status add value if not exists 'out_for_delivery' before 'delivered';

alter table orders
  add column courier_name text,
  add column awb_number text,
  add column estimated_delivery date default (current_date + 5),
  add column tracking_events jsonb not null default '[]'::jsonb;  -- [{status, at, note, location}]
create index orders_awb_idx on orders (awb_number);

create or replace function seed_tracking_event() returns trigger
language plpgsql as $$
begin
  new.tracking_events := jsonb_build_array(jsonb_build_object('status', 'ordered', 'at', now(), 'note', 'Order placed'));
  return new;
end $$;
create trigger orders_seed_tracking before insert on orders
  for each row execute function seed_tracking_event();

-- Guest tracking needs BOTH the order number and the phone used at checkout.
-- Returns no address or name.
create or replace function track_order(p_order_number text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'order_status', o.order_status, 'payment_status', o.payment_status,
    'courier_name', o.courier_name, 'awb_number', o.awb_number,
    'estimated_delivery', o.estimated_delivery, 'tracking_events', o.tracking_events,
    'placed_at', o.created_at,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('title', i.title, 'quantity', i.quantity)), '[]'::jsonb)
              from order_items i where i.order_id = o.id))
  from orders o
  where o.order_number = upper(trim(p_order_number)) and o.phone = trim(p_phone);
$$;
revoke all on function track_order(text, text) from public, anon, authenticated;
grant execute on function track_order(text, text) to service_role;

-- ---------- Reviews: title, photos, moderation ----------------------
alter table reviews
  add column title  text check (char_length(title) <= 150),
  add column images text[] not null default '{}' check (coalesce(array_length(images, 1), 0) <= 3),
  add column status text not null default 'pending' check (status in ('pending', 'approved', 'hidden'));
update reviews set status = 'approved';   -- existing rows stay visible

-- Only approved reviews count toward the product rating
create or replace function refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  update products p set
    rating_count = s.c, avg_rating = coalesce(round(s.a, 1), 0),
    rating_histogram = jsonb_build_object('1', s.r1, '2', s.r2, '3', s.r3, '4', s.r4, '5', s.r5)
  from (select count(*) c, avg(rating) a,
               count(*) filter (where rating = 1) r1, count(*) filter (where rating = 2) r2,
               count(*) filter (where rating = 3) r3, count(*) filter (where rating = 4) r4,
               count(*) filter (where rating = 5) r5
        from reviews where product_id = pid and status = 'approved') s
  where p.id = pid;
  return null;
end $$;
drop trigger if exists reviews_rating_refresh on reviews;
create trigger reviews_rating_refresh after insert or delete or update of rating, status on reviews
  for each row execute function refresh_product_rating();

drop policy if exists "public read reviews" on reviews;
drop policy if exists "public add review" on reviews;
create policy "public read approved reviews" on reviews for select to anon, authenticated
  using (status = 'approved' or is_admin());
create policy "public add review" on reviews for insert to anon, authenticated
  with check (verified = false and helpful_count = 0 and status = 'pending'
              and exists (select 1 from products where id = product_id and is_active));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "public read review photos" on storage.objects for select using (bucket_id = 'review-photos');
create policy "public upload review photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'review-photos');
