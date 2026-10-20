# Manual end-to-end checklist (Razorpay Test Mode, deployed or `npm run dev` + a tunnel for the webhook)

Use the test UPI IDs and test cards from Razorpay's test-mode docs.

Checkout
- [ ] COD order: appears in /admin/orders as `cod_pending`; stock drops by the quantity.
- [ ] UPI success and card success: order becomes `paid` / `confirmed` within seconds.
- [ ] UPI failure: order stays `pending`; retrying payment in the same window can still succeed.
- [ ] Close the tab right after paying: the webhook still marks the order paid.
- [ ] Edit the price in the browser's localStorage cart, then pay: the charged amount is the database price.
- [ ] Two browsers buy the last unit at once: exactly one succeeds, the other sees "insufficient stock".
- [ ] Leave an online order unpaid 30+ minutes (or run `select release_stale_orders(0)`): it cancels and stock returns.
- [ ] Known edge: pay after the order was auto-cancelled leaves it `cancelled` + `paid`; refund it from the Razorpay dashboard.

Webhook
- [ ] `curl -X POST <url>/api/webhooks/razorpay -d '{}'` with no or a wrong signature returns 400.
- [ ] Razorpay dashboard > Webhooks > resend an event: order state does not change twice.

Tracking
- [ ] Correct order ID + phone shows the timeline; wrong phone shows "No order matches".
- [ ] Admin sets Shipped with courier + AWB: /track-order shows them at once; "Out for delivery", "Delivered" advance the bar.

Admin
- [ ] Signed-out / non-admin user: every /api/admin/* call returns 401 and /admin shows no data.
- [ ] Shipped without courier or AWB is rejected (400).
- [ ] Cancelling in admin restocks. Marking a COD order delivered flips it to `cod_collected`.
- [ ] Add product with image upload; edit stock; hide product (disappears from store, stays in old orders).
- [ ] Submit a review with a photo as a visitor: invisible until approved; approve updates the star rating; hide removes it.
