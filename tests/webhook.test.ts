import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
process.env.RAZORPAY_KEY_SECRET = "key_secret_test";
process.env.RAZORPAY_KEY_ID = "rzp_test_x";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
const { POST } = await import("./webhook.ts");
const { verifyCheckoutSignature, verifyWebhookSignature } = await import("./lib/razorpay.ts");
const g = globalThis as any;
beforeEach(() => { g.__calls.length = 0; g.__rpc = {}; });

const sign = (body: string, secret = "whsec_test") => crypto.createHmac("sha256", secret).update(body).digest("hex");
const send = (raw: string, sig?: string, id = "evt_1") =>
  POST(new Request("http://x/api/webhooks/razorpay", { method: "POST", body: raw,
    headers: { "x-razorpay-signature": sig ?? sign(raw), "x-razorpay-event-id": id } }));
const evt = (event: string, amount = 149900) =>
  JSON.stringify({ event, created_at: 1, payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount } } } });
const rpcCalls = () => g.__calls.filter((c: any[]) => c[0] === "rpc");

test("webhook: missing signature is rejected, nothing written", async () => {
  const r = await POST(new Request("http://x", { method: "POST", body: evt("payment.captured") }));
  assert.equal(r.status, 400); assert.equal(g.__calls.length, 0);
});
test("webhook: signature made with the wrong secret is rejected", async () => {
  const raw = evt("payment.captured");
  assert.equal((await send(raw, sign(raw, "attacker"))).status, 400); assert.equal(g.__calls.length, 0);
});
test("webhook: tampered body (amount changed after signing) is rejected", async () => {
  const sig = sign(evt("payment.captured", 100));
  assert.equal((await send(evt("payment.captured", 1), sig)).status, 400); assert.equal(g.__calls.length, 0);
});
test("webhook: fails closed when the webhook secret is not configured", async () => {
  const raw = evt("payment.captured"), sig = sign(raw);
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  try { assert.equal((await send(raw, sig)).status, 400); } finally { process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test"; }
});
for (const name of ["payment.captured", "order.paid"]) {
  test(`webhook: ${name} marks the order paid with the exact amount`, async () => {
    const r = await send(evt(name));
    assert.equal(r.status, 200);
    assert.deepEqual(rpcCalls()[0].slice(1), ["mark_order_paid", { p_razorpay_order_id: "order_1", p_payment_id: "pay_1", p_amount_paise: 149900 }]);
  });
}
test("webhook: audit row is written with ignoreDuplicates", async () => {
  await send(evt("payment.captured"));
  const up = g.__calls.find((c: any[]) => c[0] === "upsert");
  assert.deepEqual(up.slice(1), ["webhook_events", { event_id: "evt_1", event_type: "payment.captured" }, { onConflict: "event_id", ignoreDuplicates: true }]);
});
test("webhook: replayed event is safe (DB function is idempotent, handler still acks)", async () => {
  assert.equal((await send(evt("payment.captured"))).status, 200);
  assert.equal((await send(evt("payment.captured"))).status, 200);
});
test("webhook: payment.failed does not touch the order", async () => {
  assert.equal((await send(evt("payment.failed"))).status, 200); assert.equal(rpcCalls().length, 0);
});
test("webhook: amount mismatch is acked (200) so Razorpay does not retry forever", async () => {
  g.__rpc.mark_order_paid = () => ({ data: null, error: { message: "amount mismatch", code: "P0001" } });
  const orig = console.error; console.error = () => {};
  try { assert.equal((await send(evt("payment.captured"))).status, 200); } finally { console.error = orig; }
});
test("webhook: transient DB error returns 500 so Razorpay retries", async () => {
  g.__rpc.mark_order_paid = () => ({ data: null, error: { message: "connection reset", code: "08006" } });
  assert.equal((await send(evt("payment.captured"))).status, 500);
  assert.equal(g.__calls.filter((c: any[]) => c[0] === "upsert").length, 0);
});

test("checkout signature: valid, wrong, swapped ids, empty, and different length never throw", () => {
  const good = crypto.createHmac("sha256", "key_secret_test").update("order_1|pay_1").digest("hex");
  assert.equal(verifyCheckoutSignature("order_1", "pay_1", good), true);
  assert.equal(verifyCheckoutSignature("order_1", "pay_2", good), false);
  assert.equal(verifyCheckoutSignature("pay_1", "order_1", good), false);
  assert.equal(verifyCheckoutSignature("order_1", "pay_1", ""), false);
  assert.equal(verifyCheckoutSignature("order_1", "pay_1", "abc"), false);
});
test("webhook signature helper agrees with the handler", () => {
  assert.equal(verifyWebhookSignature("{}", sign("{}")), true);
  assert.equal(verifyWebhookSignature("{}", sign("{ }")), false);
});
