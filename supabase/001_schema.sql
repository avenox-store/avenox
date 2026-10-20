-- =====================================================================
-- Storefront schema for Supabase (PostgreSQL 15+)
-- Run in: Supabase Dashboard > SQL Editor
-- =====================================================================
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ---------- Enums ----------------------------------------------------
create type payment_method as enum ('upi', 'card', 'netbanking', 'cod');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cod_pending', 'cod_collected');
create type order_status   as enum ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- ---------- Helpers --------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Admins ---------------------------------------------------
create table admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ---------- Categories -----------------------------------------------
create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_id  uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Products -------------------------------------------------
create table products (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 3 and 250),
  description_bullets text[] not null default '{}',
  price              numeric(10,2) not null check (price >= 0),
  mrp                numeric(10,2) not null check (mrp >= 0),
  stock              integer not null default 0 check (stock >= 0),
  images             text[] not null default '{}',
  category_id        uuid references categories(id) on delete set null,
  -- denormalised rating stats, maintained by trigger on reviews
  avg_rating         numeric(2,1) not null default 0,
  rating_count       integer not null default 0,
  rating_histogram   jsonb not null default '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint price_lte_mrp check (price <= mrp),
  search             tsvector generated always as (to_tsvector('simple', title)) stored
);
create index products_category_idx on products (category_id) where is_active;
create index products_search_idx   on products using gin (search);
create index products_title_trgm   on products using gin (title gin_trgm_ops);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

-- ---------- Reviews --------------------------------------------------
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  user_name     text not null check (char_length(user_name) between 1 and 60),
  rating        smallint not null check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 2000),
  verified      boolean not null default false,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at    timestamptz not null default now()
);
create index reviews_product_idx on reviews (product_id, created_at desc);

create or replace function refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  update products p set
    rating_count = s.c,
    avg_rating   = coalesce(round(s.a, 1), 0),
    rating_histogram = jsonb_build_object('1', s.r1, '2', s.r2, '3', s.r3, '4', s.r4, '5', s.r5)
  from (
    select count(*) c, avg(rating) a,
           count(*) filter (where rating = 1) r1, count(*) filter (where rating = 2) r2,
           count(*) filter (where rating = 3) r3, count(*) filter (where rating = 4) r4,
           count(*) filter (where rating = 5) r5
    from reviews where product_id = pid
  ) s
  where p.id = pid;
  return null;
end $$;

create trigger reviews_rating_refresh
  after insert or delete or update of rating on reviews
  for each row execute function refresh_product_rating();

create or replace function increment_helpful(p_review_id uuid) returns integer
language sql security definer set search_path = public as $$
  update reviews set helpful_count = helpful_count + 1
  where id = p_review_id returning helpful_count;
$$;

-- ---------- Orders ---------------------------------------------------
create sequence order_number_seq start 1001;

create table orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('ORD-' || nextval('order_number_seq')),
  customer_name    text not null check (char_length(customer_name) between 2 and 100),
  phone            text not null check (phone ~ '^[6-9][0-9]{9}$'),
  address          text not null check (char_length(address) between 10 and 500),
  city             text not null,
  state            text not null,
  pincode          text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  total_amount     numeric(10,2) not null check (total_amount >= 0),
  payment_method   payment_method not null,
  payment_status   payment_status not null default 'pending',
  order_status     order_status not null default 'placed',
  razorpay_order_id text unique,
  payment_id       text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_status_idx  on orders (order_status, created_at desc);
create index orders_phone_idx   on orders (phone);
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title      text not null,                       -- snapshot at purchase time
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity   integer not null check (quantity between 1 and 10),
  line_total numeric(10,2) generated always as (unit_price * quantity) stored
);
create index order_items_order_idx on order_items (order_id);

-- Razorpay webhook audit log
create table webhook_events (
  event_id    text primary key,
  event_type  text not null,
  received_at timestamptz not null default now()
);

-- ---------- Order logic (server-only, called with service role) ------
-- Prices and stock are read from the DB; the client never sends a price.
create or replace function create_order(
  p_customer_name text, p_phone text, p_address text, p_city text,
  p_state text, p_pincode text, p_payment_method payment_method, p_items jsonb
) returns table (o_id uuid, o_number text, o_total numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_number text; v_total numeric(10,2) := 0;
  v_item jsonb; v_prod products%rowtype; v_qty int;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  insert into orders (customer_name, phone, address, city, state, pincode,
                      total_amount, payment_method, payment_status)
  values (p_customer_name, p_phone, p_address, p_city, p_state, p_pincode, 0, p_payment_method,
          (case when p_payment_method = 'cod' then 'cod_pending' else 'pending' end)::payment_status)
  returning id, order_number into v_order_id, v_number;

  -- stable lock order prevents deadlocks between concurrent checkouts
  for v_item in
    select value from jsonb_array_elements(p_items) order by value->>'product_id'
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'invalid quantity'; end if;

    select * into v_prod from products
    where id = (v_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'product unavailable'; end if;
    if v_prod.stock < v_qty then raise exception 'insufficient stock for %', v_prod.title; end if;

    update products set stock = stock - v_qty where id = v_prod.id;
    insert into order_items (order_id, product_id, title, unit_price, quantity)
    values (v_order_id, v_prod.id, v_prod.title, v_prod.price, v_qty);
    v_total := v_total + v_prod.price * v_qty;
  end loop;

  update orders set total_amount = v_total where id = v_order_id;
  return query select v_order_id, v_number, v_total;
end $$;

-- Idempotent: safe to call from both the verify endpoint and the webhook.
create or replace function mark_order_paid(p_razorpay_order_id text, p_payment_id text, p_amount_paise bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype;
begin
  select * into v_order from orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then return false; end if;
  if v_order.payment_status = 'paid' then return true; end if;
  if (v_order.total_amount * 100)::bigint <> p_amount_paise then
    raise exception 'amount mismatch';
  end if;
  update orders set
    payment_status = 'paid',
    payment_id = p_payment_id,
    order_status = case when order_status = 'placed' then 'confirmed' else order_status end
  where id = v_order.id;
  return true;
end $$;

create or replace function cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from orders where id = p_order_id and order_status <> 'cancelled' for update;
  if not found then return; end if;

  update products p set stock = p.stock + oi.q
  from (select product_id, sum(quantity)::int q from order_items
        where order_id = p_order_id and product_id is not null group by product_id) oi
  where p.id = oi.product_id;

  update orders set
    order_status = 'cancelled',
    payment_status = case when payment_status = 'pending' then 'failed' else payment_status end
  where id = p_order_id;
end $$;

-- Releases stock held by unpaid online orders. Schedule with pg_cron:
--   select cron.schedule('release-stale-orders', '*/10 * * * *', 'select release_stale_orders(30)');
create or replace function release_stale_orders(p_minutes int default 30) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from orders
           where payment_status = 'pending' and order_status = 'placed'
             and created_at < now() - make_interval(mins => p_minutes)
  loop perform cancel_order(r.id); n := n + 1; end loop;
  return n;
end $$;

-- ---------- Search ---------------------------------------------------
create or replace function search_products(
  p_query text default '', p_category_slug text default null,
  p_min_rating numeric default 0, p_limit int default 24, p_offset int default 0
) returns table (id uuid, title text, price numeric, mrp numeric, images text[],
                 avg_rating numeric, rating_count int, stock int)
language sql stable as $$
  select p.id, p.title, p.price, p.mrp, p.images, p.avg_rating, p.rating_count, p.stock
  from products p
  left join categories c on c.id = p.category_id
  where p.is_active
    and p.avg_rating >= p_min_rating
    and (p_category_slug is null or c.slug = p_category_slug)
    and (coalesce(trim(p_query), '') = ''
         or p.search @@ websearch_to_tsquery('simple', p_query)
         or p.title ilike '%' || p_query || '%')
  order by similarity(p.title, coalesce(p_query, '')) desc, p.rating_count desc
  limit least(p_limit, 60) offset p_offset;
$$;

-- Live-search dropdown suggestions
create or replace function suggest_products(p_query text, p_limit int default 8)
returns table (id uuid, title text)
language sql stable as $$
  select p.id, p.title from products p
  where p.is_active and char_length(trim(p_query)) >= 2
    and (p.title ilike '%' || trim(p_query) || '%' or trim(p_query) <% p.title)
  order by word_similarity(trim(p_query), p.title) desc, p.rating_count desc
  limit least(p_limit, 10);
$$;

-- ---------- Row Level Security ---------------------------------------
alter table categories    enable row level security;
alter table products      enable row level security;
alter table reviews       enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table admin_users   enable row level security;
alter table webhook_events enable row level security;

create policy "public read categories" on categories for select to anon, authenticated using (true);
create policy "admin manage categories" on categories for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "public read active products" on products for select to anon, authenticated
  using (is_active or is_admin());
create policy "admin manage products" on products for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "public read reviews" on reviews for select to anon, authenticated using (true);
create policy "public add review" on reviews for insert to anon, authenticated
  with check (verified = false and helpful_count = 0
              and exists (select 1 from products where id = product_id and is_active));
create policy "admin manage reviews" on reviews for all to authenticated
  using (is_admin()) with check (is_admin());

-- orders, order_items, admin_users, webhook_events: no policies and no direct
-- grants. They are reachable only through the service-role key on the server.
revoke all on orders, order_items, admin_users, webhook_events from anon, authenticated;

-- Lock down server-only functions
revoke all on function create_order(text,text,text,text,text,text,payment_method,jsonb) from public, anon, authenticated;
revoke all on function mark_order_paid(text,text,bigint) from public, anon, authenticated;
revoke all on function cancel_order(uuid) from public, anon, authenticated;
revoke all on function release_stale_orders(int) from public, anon, authenticated;
grant execute on function create_order(text,text,text,text,text,text,payment_method,jsonb) to service_role;
grant execute on function mark_order_paid(text,text,bigint) to service_role;
grant execute on function cancel_order(uuid) to service_role;
grant execute on function release_stale_orders(int) to service_role;
grant execute on function increment_helpful(uuid) to anon, authenticated;

-- ---------- Storage (product images) ---------------------------------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
create policy "public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin write product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ---------- Make yourself an admin (after signing up in Auth) --------
-- insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';
