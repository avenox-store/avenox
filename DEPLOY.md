# Deploy from your phone: Supabase + GitHub + Vercel (+ Razorpay test mode)

Plans: Vercel's free Hobby plan is for personal, non-commercial use only. Use it to build and test; a live store taking payments needs Vercel Pro. Supabase Free pauses a project after about 7 days of inactivity; use Pro (or regular traffic) for a live store.

Tip: phone browsers work best for these dashboards with "Desktop site" switched on.

## Part A: Supabase (supabase.com)
1. Sign in, New project. Region: Mumbai (ap-south-1). Choose and save a strong database password.
2. Open the project, SQL Editor, New query. Paste `supabase/001_schema.sql` and Run. Then a NEW query for `002_tracking_reviews.sql` and Run. Then a NEW query for `003_fulfilment.sql` and Run. Each should say Success. (Open each file on GitHub, tap Raw, select all, copy.)
3. Optional check: run `supabase/tests/orders_flow.test.sql`. No error means everything passed; a failure shows a message.
4. Authentication, Users, Add user, Create new user: your admin email and password, tick auto-confirm.
5. SQL Editor, run (use your email):
   `insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';`
6. Add categories (the admin panel does not manage categories yet):
   `insert into categories (name, slug) values ('Mobiles','mobiles'),('Fashion','fashion'),('Electronics','electronics'),('Home','home');`
7. Project Settings, API: copy Project URL, `anon` key and `service_role` key. Never share the service_role key.
8. Optional: Database, Extensions, enable `pg_cron`, then run
   `select cron.schedule('release-stale-orders','*/10 * * * *','select release_stale_orders(30)');`

## Part B: Put the code on GitHub (no laptop)
1. github.com: New repository, Private, tick "Add a README". Create.
2. On the repo page: Code, Codespaces, Create codespace on main (free monthly allowance; wait for the editor to load).
3. In the Explorer (left), tap the ... menu, Upload..., choose `store.zip`.
4. Open the Terminal (menu, Terminal, New Terminal) and run:
   `unzip -o store.zip && rm store.zip && git add -A && git commit -m "Add store" && git push`
5. Check github.com/your-repo shows `package.json`, `src/`, `supabase/`. You can stop the codespace afterwards.

## Part C: Vercel (vercel.com)
1. Continue with GitHub. Add New, Project, Import your repo. Framework should say Next.js.
2. Environment Variables: add these 7 (names exactly as shown, no spaces):
   NEXT_PUBLIC_BRAND (your store name), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.
   Use `rzp_test_` Razorpay keys for now, and any long random text for RAZORPAY_WEBHOOK_SECRET (you will reuse it in Part D). Mark the service_role key and the two Razorpay secrets as Sensitive.
3. Deploy (about 2 minutes). Open the URL it gives you.
4. If the build fails, open the build log, copy the red error lines and send them to me.
5. Back in Supabase: Authentication, URL Configuration, set Site URL to your Vercel URL.

## Part D: Razorpay test mode (dashboard.razorpay.com)
1. Make sure Test Mode is on. Settings, API Keys: generate keys and put them in Vercel (Settings, Environment Variables).
2. Settings, Payment Capture: automatic.
3. Settings, Webhooks, Add: URL `https://YOUR-VERCEL-URL/api/webhooks/razorpay`, secret = the same text as RAZORPAY_WEBHOOK_SECRET, events `payment.captured`, `order.paid`, `payment.failed`.
4. In Vercel: Deployments, the latest one, the ... menu, Redeploy (needed after changing env vars).

## Part E: Smoke test
1. Open `/admin`, sign in, Products, + New: add a product with a title, price, MRP, stock and an uploaded image.
2. On the home page, open the product, add to cart, check out with Cash on Delivery.
3. In `/admin/orders` mark it Shipped with a courier and AWB. On `/track-order` enter the order ID and phone: the bar and AWB should appear.
4. Repeat checkout with UPI or card using Razorpay's test details: the order should turn paid within seconds.

## Going live later
Complete Razorpay KYC, switch to Live Mode, create live keys and a live webhook, replace the three Razorpay values in Vercel, redeploy. Upgrade Vercel to Pro, add rate limiting, and add privacy, terms and refund pages with your business details.
