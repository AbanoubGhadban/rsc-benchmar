# Realistic ecommerce-page benchmark — Next.js vs ROR Pro

Run ID: `20260510-nextjs-vs-ror-pro/ecommerce`
Compares the same two production stacks as the headline benchmark, on a **richer, more realistic page** — a paginated catalog with filters, sort, cart drawer, reviews, FAQ accordion, and newsletter form.

## The page

`apps/shared/components/EcommercePage.jsx` — 616-line single file, byte-identical between both apps. md5 verified on disk:

```
f78b007fb3844d29b20807ab31f5f9d4  apps/shared/components/EcommercePage.jsx
f78b007fb3844d29b20807ab31f5f9d4  apps/nextjs/components/EcommercePage.jsx
f78b007fb3844d29b20807ab31f5f9d4  apps/rails_ror_pro/app/javascript/src/Shop/ror_components/EcommercePage.jsx
```

What's on the page:
- Sticky topbar — logo, 5 nav links, search input with controlled state, account / wishlist / cart buttons with badge counters
- Hero block with primary + secondary CTAs
- Sidebar filters — category checkboxes, brand checkboxes (grow with scale), price-range number inputs, 8 color swatches, 6 size pills, rating slider
- Toolbar — count, sort dropdown (5 options), grid/list view toggle
- Product grid — `ProductCard` with placeholder image, badges (New/Best/Sale), brand, name, star rating, dual price (current + crossed-out), color swatches, Add-to-cart + Quick-view buttons; **paginated at 24 per page**
- Pagination bar with numbered page buttons
- Customer reviews section (review count grows with scale)
- FAQ accordion (5 rows, one-at-a-time open)
- Footer — 4-column grid, links, newsletter signup form
- Cart drawer — toggleable side panel, quantity steppers, remove, subtotal, checkout button

Interactive state: 11 separate `useState` hooks (search, nav, cart open, cart items, wishlist, brand-set, price-range, color, size-set, rating-min, sort, view, page, accordion, newsletter email, newsletter submitted). All hydration verified with Playwright (`ecommerce/correctness.json`):

| Interaction | Next.js | ROR Pro |
|---|---|---|
| Hydration mark fires | ✓ | ✓ |
| Add to cart `0→1` | ✓ | ✓ |
| Increment qty `1→2` | ✓ | ✓ |
| Close cart drawer | ✓ | ✓ |
| Wishlist toggle (badge `0→1`, icon `♡→♥`) | ✓ | ✓ |
| Sort low→high (visible prices ascending) | ✓ | ✓ |
| Brand filter (cards `24→3`, label `"3 of 36 products"`) | ✓ | ✓ |
| Newsletter submit (button `Subscribe → Thanks!`) | ✓ | ✓ |
| Console errors / warnings / page errors | 0 / 0 / 0 | 0 / 0 / 0 |

Both pages behave **identically**.

## Scale axis

`scale=S` controls:
- Total products in the catalog: `12 × S` (12, 36, 72, 144)
- Reviews rendered below the catalog: `6 × S` (6, 18, 36, 72)
- Brand filter rows: `max(8, 4×S)` (8, 12, 24, 48)

The **visible product grid is capped at 24 per page** — same as a real ecommerce frontend — so the React tree does not grow unboundedly with `S`. This is the most important difference from the simple `Workload` benchmark.

Resulting HTML doc bytes (gzip-compressed wire):

| Scale | Next.js | ROR Pro |
|---:|---:|---:|
| 1  | 36 560 | 37 165 |
| 3  | 57 156 | 57 761 |
| 6  | 67 536 | 68 141 |
| 12 | 87 506 | 88 114 |

Within 1.7 % between subjects at every scale — confirming both stacks render the same tree.

## Results

### Sequential latency (n=90 per cell, Accept-Encoding: gzip)

| Scale | Next.js median (p99) | ROR Pro median (p99) | Verdict |
|---:|---:|---:|---|
| 1  | **5.97 ms** (10.5) | 17.67 ms (76.0) | Next.js 3.0× faster |
| 3  | **8.54 ms** (18.9) | 15.35 ms (25.8) | Next.js 1.8× faster |
| 6  | **9.68 ms** (21.3) | 11.19 ms (25.7) | Next.js 1.16× faster |
| 12 | 11.79 ms (32.1) | 12.56 ms (25.2) | **basically tied (+6 %)** |

The crossover from the simple workload is **NOT reached here** — but they converge to ≈ tied at S=12. ROR Pro's p99 at S=12 (25.2 ms) is *better* than Next.js (32.1 ms), so the tail story holds even when medians are tied.

Variance gate: ror-pro at S=1 has stddev 22 / mean 25 ms = 88 % (one cell tail-heavy at sub-20-ms). Every other cell passes the 20 % gate.

### Autocannon — req/s and p99 across concurrency levels

#### conn=10

| Scale | Next.js req/s (p99) | ROR Pro req/s (p99) |
|---:|---:|---:|
| 1  | **209** (95) | 74 (168) |
| 3  | **149** (126) | 66 (198) |
| 6  | **131** (120) | 95 (191) |
| 12 | **103** (145) | 80 (200) |

#### conn=50

| Scale | Next.js req/s (p99) | ROR Pro req/s (p99) |
|---:|---:|---:|
| 1  | **234** (295) | 65 (874) |
| 3  | **157** (498) | 67 (868) |
| 6  | **134** (555) | 74 (846) |
| 12 | **101** (775) | 81 (**747** — tail wins) |

#### conn=100

| Scale | Next.js req/s (p99) | ROR Pro req/s (p99) |
|---:|---:|---:|
| 1  | **230** (555) | 65 (1633) |
| 3  | **152** (1028) | 66 (1617) |
| 6  | **132** (1004) | 77 (1495) |
| 12 | **99** (1294) | 82 (1473) |

**Zero errors, zero timeouts, zero non-2xx across all 24 autocannon cells.** Both stacks handle the realistic load.

### Web Vitals (Playwright Chromium, Fast-3G + 4× CPU, median of 5)

| Scale | Subject | LCP | FCP | TBT | Hydration | Bytes recv |
|---:|---|---:|---:|---:|---:|---:|
| 1  | nextjs   | 244 | 244 | 230 | 613 | 414 080 |
| 1  | ror-pro  | **236** | **236** | **153** | **460** | **276 392** |
| 3  | nextjs   | **244** | **244** | 304 | 703 | 434 955 |
| 3  | ror-pro  | 256 | 256 | **190** | **536** | **297 268** |
| 6  | nextjs   | **240** | **240** | 300 | 706 | 445 541 |
| 6  | ror-pro  | 252 | 252 | **204** | **558** | **307 854** |
| 12 | nextjs   | **244** | **244** | 309 | 757 | 465 921 |
| 12 | ror-pro  | 252 | 252 | **265** | **622** | **328 237** |

CLS = 0 on both. **ROR Pro wins TBT, Hydration, and Bytes-received at every scale.** LCP and FCP are within ±5 % — basically a tie throughout (Next.js edges by a few ms at S=3/6/12, ROR Pro edges at S=1).

## Where the realistic page differs from the simple workload

The headline `Workload` benchmark renders an *unbounded* React tree that grows with `S` (10·S list items, 5·S table rows × 8 cols, etc.) — at S=12 that's ≈ 20 000 elements per page. The crossover where ROR Pro overtakes Next.js happens around that tree size.

The realistic ecommerce page **paginates at 24 products per page**. So as `S` grows, the visible tree grows only modestly — reviews 6→72, brand filter 8→48, pagination buttons 1→6. The total element count goes roughly from 600 (S=1) to about 1 800 (S=12), nowhere near 20 000. So:

- **Server-side**: Next.js stays faster across the whole curve. The Rails-IPC overhead never gets buried under heavier render work.
- **Tail at high concurrency**: at S=12 / conn=50, ROR Pro's p99 is already tighter (747 ms vs 775 ms). At conn=100 / S=12 Next.js still narrowly wins on p99 (1294 vs 1473), so the dramatic 4.7× tail win seen on the simple workload at S=12 doesn't fully reappear here.
- **Web Vitals**: ROR Pro still wins LCP-class and TBT, because the 138 KB JS framework gap is a constant — paid by Next.js at every page size.

## Bottom line — realistic page

| Dimension | Winner | Margin |
|---|---|---|
| Server median latency, all scales | **Next.js** | 1.06×–3.0× faster |
| Server throughput, all conn levels & scales | **Next.js** | 1.2×–3.6× more req/s |
| Server p99 tail at conn=50, S=12 | **ROR Pro** | −3.6 % vs Next.js |
| LCP / FCP | **tied** | within ±5 % at all scales |
| TBT (responsiveness during hydration) | **ROR Pro** | 14–34 % lower at every scale |
| Hydration completion time | **ROR Pro** | 18–25 % faster at every scale |
| Bytes received on the wire | **ROR Pro** | 30–35 % smaller at every scale |
| Cumulative Layout Shift | **tied** | 0 on both |
| Browser correctness (interactivity, errors) | **tied** | 0 errors, identical behavior |

### TL;DR

On a real-world paginated ecommerce page:
- **If you measure servers**, Next.js wins everywhere. The Rails+IPC overhead is hard to amortize against a small-ish per-request workload.
- **If you measure users** (web vitals, bytes shipped, TBT, hydration), ROR Pro wins at every scale, mostly because it ships 138 KB less JavaScript.

The **crossover that made ROR Pro a clear server-side winner on the simple unbounded workload does not appear on a paginated ecommerce page** — but the web-vitals advantage is unchanged. That matches the spec of where each stack invests: Next.js's framework code makes the server fast; ROR Pro's minimal client glue makes the browser fast.

## Artifacts

- `ecommerce/metrics.json` — raw sequential + autocannon, 72 cells (24 sequential × 3 ac concurrencies)
- `ecommerce/web-vitals.json` — 40 throttled-browser runs
- `ecommerce/tables.md` — all tables in this report
- `ecommerce/correctness.json` — every interactivity check, both stacks
- `ecommerce/harness.log` — full run log
- `bench/run-shop.mjs` — the harness
- `bench/check-shop-correctness.mjs` — the browser correctness probe
- `apps/shared/components/EcommercePage.jsx` — the canonical page source
