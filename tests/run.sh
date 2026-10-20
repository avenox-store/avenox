#!/usr/bin/env bash
# Runs the unit tests with zero installs (Node >= 22.18). From the merged app root: bash tests/run.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; W="$(mktemp -d)"
mkdir -p "$W/lib" "$W/node_modules"
cp -r "$ROOT/tests/stubs/." "$W/node_modules/"
echo '{"type":"module"}' > "$W/package.json"
for f in razorpay supabase-admin format; do cp "$ROOT/src/lib/$f.ts" "$W/lib/"; done
sed -E 's#"@/lib/([a-z-]+)"#"./lib/\1.ts"#' "$ROOT/src/app/api/webhooks/razorpay/route.ts" > "$W/webhook.ts"
cp "$ROOT"/tests/*.test.ts "$W/"
cd "$W" && node --experimental-strip-types --no-warnings --test
