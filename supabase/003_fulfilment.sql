-- Run after 002. Admin fulfilment: courier, AWB, status and tracking timeline in one atomic call.
create or replace function update_fulfilment(
  p_order_id uuid, p_status order_status default null, p_courier text default null,
  p_awb text default null, p_location text default null, p_note text default null
) returns void language plpgsql security definer set search_path = public as $$
declare v orders%rowtype;
begin
  select * into v from orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v.order_status = 'cancelled' then raise exception 'order is cancelled'; end if;

  update orders set
    courier_name = coalesce(nullif(p_courier, ''), courier_name),
    awb_number   = coalesce(nullif(p_awb, ''), awb_number),
    order_status = coalesce(p_status, order_status)
  where id = p_order_id;

  if (p_status is not null and p_status <> v.order_status) or coalesce(p_note, '') <> '' then
    update orders set tracking_events = tracking_events || jsonb_build_array(jsonb_build_object(
      'status', coalesce(p_status, v.order_status)::text, 'at', now(),
      'note', nullif(p_note, ''), 'location', nullif(p_location, ''))) where id = p_order_id;
  end if;

  -- cash is collected by the courier at delivery
  if p_status = 'delivered' and v.payment_method = 'cod' and v.payment_status = 'cod_pending' then
    update orders set payment_status = 'cod_collected' where id = p_order_id;
  end if;
end $$;
revoke all on function update_fulfilment(uuid, order_status, text, text, text, text) from public, anon, authenticated;
grant execute on function update_fulfilment(uuid, order_status, text, text, text, text) to service_role;
