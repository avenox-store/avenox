module.exports = class Razorpay { constructor(o) { this.opts = o; this.orders = { create: async () => ({ id: "order_stub", amount: 0 }) }; this.payments = { fetch: async () => ({}) }; } };
