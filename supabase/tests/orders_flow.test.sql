-- Run in the Supabase SQL editor (role postgres) AFTER schema.sql, 002 and 003.
-- Everything is rolled back. Success = a NOTICE "ALL TESTS PASSED"; any failure raises with a message.
begin;
do $$
declare cat uuid; p1 uuid; p2 uuid; o record; s int; res jsonb;
        addr text := '12 Test Street, Area';
begin
  insert into categories (name, slug) values ('T', 't-' || gen_random_uuid()::text) returning id into cat;
  insert into products (title, price, mrp, stock, category_id) values ('Test A', 100, 200, 5, cat) returning id into p1;
  insert into products (title, price, mrp, stock, category_id) values ('Test B', 50, 50, 1, cat) returning id into p2;

  -- create_order: total from DB prices, stock reserved, COD status, seed tracking event
  select * into o from create_order('Test User', '9876543210', addr, 'Pune', 'Maharashtra', '411001', 'cod',
    jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 2), jsonb_build_object('product_id', p2, 'quantity', 1)));
  assert o.o_total = 250, 'total must come from DB prices (250)';
  assert (select stock from products where id = p1) = 3, 'p1 stock reserved';
  assert (select stock from products where id = p2) = 0, 'p2 sold out';
  assert (select payment_status from orders where id = o.o_id) = 'cod_pending', 'COD starts cod_pending';
  assert (select jsonb_array_length(tracking_events) from orders where id = o.o_id) = 1, 'seed tracking event';

  -- overselling is rejected and leaves stock untouched
  begin
    perform create_order('Test User', '9876543210', addr, 'Pune', 'Maharashtra', '411001', 'cod',
      jsonb_build_array(jsonb_build_object('product_id', p2, 'quantity', 1)));
    raise exception 'oversell was allowed';
  exception when others then
    if sqlerrm = 'oversell was allowed' then raise; end if;
    assert sqlerrm like 'insufficient stock%', 'unexpected error: ' || sqlerrm;
  end;
  assert (select stock from products where id = p2) = 0, 'failed order must not change stock';

  -- invalid quantity and empty cart rejected
  begin
    perform create_order('Test User', '9876543210', addr, 'Pune', 'Maharashtra', '411001', 'cod',
      jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 99)));
    raise exception 'bad quantity allowed';
  exception when others then if sqlerrm = 'bad quantity allowed' then raise; end if; end;
  begin
    perform create_order('Test User', '9876543210', addr, 'Pune', 'Maharashtra', '411001', 'cod', '[]'::jsonb);
    raise exception 'empty cart allowed';
  exception when others then if sqlerrm = 'empty cart allowed' then raise; end if; end;

  -- cancel restocks exactly once, and a cancelled order cannot be fulfilled
  perform cancel_order(o.o_id); perform cancel_order(o.o_id);
  assert (select stock from products where id = p1) = 5, 'restock exactly once';
  begin
    perform update_fulfilment(o.o_id, 'shipped', 'Delhivery', 'AWB1');
    raise exception 'cancelled order was fulfilled';
  exception when others then if sqlerrm = 'cancelled order was fulfilled' then raise; end if; end;

  -- online order: amount check, idempotent payment, unknown order
  select * into o from create_order('Test User', '9876543210', addr, 'Pune', 'Maharashtra', '411001', 'upi',
    jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 1)));
  update orders set razorpay_order_id = 'order_test_1' where id = o.o_id;
  begin
    perform mark_order_paid('order_test_1', 'pay_1', 1);
    raise exception 'amount mismatch allowed';
  exception when others then assert sqlerrm = 'amount mismatch', 'unexpected: ' || sqlerrm; end;
  assert mark_order_paid('order_test_1', 'pay_1', 10000), 'first payment';
  assert mark_order_paid('order_test_1', 'pay_1', 10000), 'replay must be a no-op';
  assert (select payment_status from orders where id = o.o_id) = 'paid' and
         (select order_status from orders where id = o.o_id) = 'confirmed', 'paid + confirmed';
  assert not mark_order_paid('order_unknown', 'pay_x', 10000), 'unknown order returns false';

  -- tracking requires BOTH order number and phone, hides address
  assert track_order(o.o_number, '9876543210') is not null, 'tracks with matching phone';
  assert track_order(o.o_number, '9000000000') is null, 'wrong phone returns nothing';
  assert (track_order(lower(o.o_number), '9876543210')->>'order_number') = o.o_number, 'case-insensitive order id';
  assert not (track_order(o.o_number, '9876543210') ? 'address'), 'address must not leak';

  -- fulfilment updates the tracking page data
  perform update_fulfilment(o.o_id, 'shipped', 'Delhivery', 'AWB123', 'Pune', 'Picked up');
  res := track_order(o.o_number, '9876543210');
  assert res->>'courier_name' = 'Delhivery' and res->>'awb_number' = 'AWB123' and res->>'order_status' = 'shipped', 'courier/awb/status';
  assert jsonb_array_length(res->'tracking_events') = 2, 'ordered + shipped events';

  -- reviews: only approved ones count toward the rating
  insert into reviews (product_id, user_name, rating, comment) values (p1, 'A', 5, 'great product');
  assert (select rating_count from products where id = p1) = 0, 'pending review must not count';
  update reviews set status = 'approved' where product_id = p1;
  assert (select rating_count from products where id = p1) = 1 and (select avg_rating from products where id = p1) = 5.0, 'approved counts';
  update reviews set status = 'hidden' where product_id = p1;
  assert (select rating_count from products where id = p1) = 0, 'hidden review stops counting';

  raise notice 'ALL TESTS PASSED';
end $$;
rollback;
