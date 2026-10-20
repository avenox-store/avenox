# Layout blueprints

Icons: `lucide-react`, 20px (24px for cart), stroke 1.75, `currentColor`.
Images: 1:1 product tiles, `object-fit: contain` on white, WebP/AVIF, lazy below the fold.
Breakpoints: mobile < 768, tablet 768-1023, desktop >= 1024, wide >= 1280 (container max 1280).

## 1. Header, desktop (>= 1024px)

```
+----------------------------------------------------------------------------------+
| [Logo]  [PIN pin 560001 v]  [ All v | Search products...            | (Q) ]  [EN v] [Account v] [Orders] [Cart (3)] |   64px, --header-bg
+----------------------------------------------------------------------------------+
| [= All]  Deals  Mobiles  Fashion  Home  Electronics  Beauty  Books      |   40px, --header-subnav-bg
+----------------------------------------------------------------------------------+
```
- Sticky, z 50. Search takes all free width (min 480px); category select 144px, radius-pill left, button 48px right.
- Search input: 44px high, white surface, 16px text (prevents iOS zoom).
- Live suggestions: after 2 chars, 200ms debounce, call `suggest_products`. Panel: white, `shadow-pop`, radius-md, max 8 rows, matched text in bold, recent searches when empty and focused. Keys: up/down/enter/esc; click-away closes; `aria-combobox` + `aria-activedescendant`.
- Category select scopes the query and is written to the URL (`/s?q=...&cat=slug`).
- Cart badge: coral pill, white 12px/600, shown when count > 0, caps at 99+.
- "All" opens a left drawer (320px) listing the category tree; overlay `rgba(11,22,38,.5)`.

## 2. Header, mobile (< 768px)

```
+------------------------------------------+
| [=]  [Logo]                  [Acct] [Cart 3] |  56px
+------------------------------------------+
| [ (Q)  Search products...        ] [cat v]|  52px row, same navy
+------------------------------------------+
| (pin) Deliver to 560001 >                 |  36px, --header-subnav-bg
+------------------------------------------+
```
- Header scrolls away on scroll down, returns on scroll up; the search row stays pinned.
- Search focus goes full screen: back arrow, input, suggestions list as full-width rows (48px), category chips under the input.
- Category menu is a bottom sheet / left drawer; tabs row of category chips optional on home.
- Cart is a bottom-right badge on the icon; sticky bottom bar on PDP (see below).

## 3. Product details card

Desktop (>= 1024): 3 columns, `grid-template-columns: 5fr 4fr 3fr; gap: 24px`.
```
+------------------+----------------------------+--------------------+
| thumbs | main    | Brand                      | BUY BOX (surface,  |
| (vertical,64px) | Title (h1)                 |  radius-lg, border) |
| image  (zoom on | *****  4.3  (1,284 ratings)| Rs 1,499            |
| hover)           | Rs 1,499  Rs 2,999  -50%   | MRP Rs 2,999 (-50%) |
|                  | Variant chips (size/colour)| Delivery by Fri,    |
|                  | - bullet 1                 |  to 560001 [Change] |
|                  | - bullet 2 ...             | In stock            |
|                  | Specs table                | Qty [1 v]           |
|                  |                            | [ Add to cart ]     |
|                  |                            | [ Buy now ]         |
|                  |                            | Secure payment: UPI,|
|                  |                            |  Cards, NetBanking, |
|                  |                            |  Pay on delivery    |
+------------------+----------------------------+--------------------+
 Below: Description | Ratings & reviews (histogram + list) | Related carousel
```
- Buy box is `position: sticky; top: calc(var(--header-h-desktop) + var(--subnav-h) + 16px)`.
- Price: `--fs-price` 700 tabular; MRP strikethrough `--text-muted` 16px; discount `--price-discount` 600.
- Rating: gold stars (partial fill via clip), average 1 decimal, count links to `#reviews`.
- Stock states: >10 "In stock" green; 1-10 "Only N left" amber; 0 "Out of stock" red and CTAs disabled.

Mobile (< 768): single column.
```
[ image carousel, swipe, 1:1, dots ]
Brand
Title (h1 20/28, max 3 lines)
**** 4.3 (1,284)
Rs 1,499  MRP Rs 2,999  -50%
Variant chips (horizontal scroll)
Delivery to 560001 [Change]   In stock
- bullets (collapsible after 4)
Specs / Reviews / Related (accordions)
------------------------------------
[sticky bottom bar, safe-area padded]
[ Add to cart ]  [ Buy now ]   (50/50, 48px)
```

## 4. Component specs (summary)

| Component | Spec |
|---|---|
| Buy now | `.btn-buy`, coral 600, white text (AA 4.6:1), pill |
| Add to cart | `.btn-cart`, teal 700, white text (AA 5.4:1), pill |
| Product card | surface, border `--border`, radius-md, `shadow-card`, padding 12, title 2 lines clamp, rating row, price row |
| Chip (variant) | 40px high, radius-pill, 1px border; selected: 2px teal border + teal-50 fill |
| Toast | bottom-center (mobile) / top-right (desktop), z 80, 4s |
| Skeletons | `--bg-muted` shimmer on image, title, price while loading |
| Touch targets | >= 44x44 everywhere; 8px minimum gap |
| Motion | 150ms ease-out; respect `prefers-reduced-motion` |
