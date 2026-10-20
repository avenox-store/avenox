import test from "node:test";
import assert from "node:assert/strict";
const { inr, pctOff, validPin, etaLabel } = await import("./lib/format.ts");

test("inr uses Indian digit grouping", () => { assert.equal(inr(1499), "₹1,499"); assert.equal(inr(1234567), "₹12,34,567"); });
test("pctOff", () => { assert.equal(pctOff(1499, 2999), 50); assert.equal(pctOff(100, 100), 0); assert.equal(pctOff(150, 100), 0); });
test("validPin", () => {
  for (const ok of ["560001", "110001"]) assert.equal(validPin(ok), true);
  for (const bad of ["056001", "56000", "5600011", "56000a", ""]) assert.equal(validPin(bad), false);
});
test("etaLabel: free-delivery threshold and metro vs non-metro dates", () => {
  assert.match(etaLabel("560001", 499), /^FREE delivery by /);
  assert.match(etaLabel("560001", 498), /^Delivery by /);
  assert.notEqual(etaLabel("560001", 999), etaLabel("781001", 999)); // 2 days vs 4 days
});
