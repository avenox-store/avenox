// Records calls so tests can assert on them. rpc results can be overridden via globalThis.__rpc[fn].
const calls = (globalThis.__calls = []);
exports.createClient = () => ({
  rpc: async (fn, args) => { calls.push(["rpc", fn, args]); const h = globalThis.__rpc && globalThis.__rpc[fn]; return h ? h(args) : { data: true, error: null }; },
  from: (t) => ({ upsert: async (row, opts) => { calls.push(["upsert", t, row, opts]); return { error: null }; } }),
});
