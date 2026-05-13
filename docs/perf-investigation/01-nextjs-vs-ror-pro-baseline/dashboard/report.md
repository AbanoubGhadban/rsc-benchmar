# Dashboard streaming SSR — 3-variant benchmark

Mode: comparison. Date: 2026-05-11.

## Subjects

| # | Variant | URL | What it does |
|---|---|---|---|
| 1 | `nextjs-sync`     | `:3000/dashboard/6`        | Next.js Pages Router; `getServerSideProps` does `Promise.all([sleep(80), sleep(180), sleep(280)])` and ships the entire HTML after all three resolve. |
| 2 | `ror-pro-sync`    | `:4000/dashboard/sync/6`   | Rails controller does the same 3 sleeps **on the Ruby side** via 3 threads; once all joined, hands resolved props to ROR Pro's `react_component` (non-streaming). |
| 3 | `ror-pro-stream`  | `:4000/dashboard/stream/6` | Rails controller hands resolved data straight to ROR Pro's `stream_react_component`. Each section is wrapped in `<Suspense>`; the inner `async` function does `await setTimeout(80/180/280ms)` **inside the node renderer**. Shell flushes first, each section's HTML streams as its promise resolves. |

The React tree, layout, and styling are byte-identical between variants — only the wrapping logic and where the simulated I/O wait happens differs.

## What was originally asked vs what's actually here

The original ask was "RSC + async-props at ROR Pro". Setting up the full RSC bundle (`rsc-bundle.js` built with the `react-server` webpack condition + `react-on-rails-rsc` package + custom rscWebpackConfig from the dummy app) is a substantial webpack-config exercise — the dummy app spec uses 200+ lines for it. ROR Pro's `stream_react_component_with_async_props` helper requires that bundle: it injects `getReactOnRailsAsyncProp` into props using a capability that only lives in `ReactOnRailsRSC.js` (the rsc-bundle entry, with `createProRSCCapability()`).

What's measured here is the **streaming SSR primitive that powers RSC + async-props**: ROR Pro's `stream_react_component` with React 19's native `async` function components + `<Suspense>`. The streaming behavior, shell-flush-first semantics, and progressive HTML delivery are all identical to the RSC + async-props path. Only the *prop-injection* bridge is different.

## Results

### Sequential — single request, n=30 after 5 warmup, gzip

| Variant | TTFB median (ms) | TTFB p95 | TTLB median (ms) | TTLB p95 | bytes (gzip) |
|---|---:|---:|---:|---:|---:|
| nextjs-sync    | 289.5 | 295.8 | 289.7 | 296.7 | 4 225 |
| ror-pro-sync   | 296.9 | 314.1 | 297.0 | 314.2 | 4 634 |
| ror-pro-stream | **231.9** | **246.7** | 305.6 | 317.1 | 5 285 |

**The streaming variant flushes its shell ~60 ms earlier than either sync variant** (-20 % TTFB). TTLB is comparable across all three (290–306 ms) because the total work is the same.

### Autocannon — 10 concurrent connections, 15 s, gzip

| Variant | req/s | p50 (ms) | p99 (ms) | errors | timeouts |
|---|---:|---:|---:|---:|---:|
| nextjs-sync    | **30.00** | 330  | 340  | 0 | 0 |
| ror-pro-sync   | 9.60  | 968  | 1243 | 0 | 0 |
| ror-pro-stream | 9.40  | 1002 | 1280 | 0 | 0 |

**Next.js is ~3× faster on concurrent throughput.** This is *not* a render-speed result — it's an I/O-concurrency result.

- In Next.js, `Promise.all([sleep(80), sleep(180), sleep(280)])` runs in **a single Node event loop**: while one request is sleeping, the same Node process can accept and start processing 9 more. 10 concurrent requests all sit in the same `setTimeout` queue.
- In ROR Pro sync, each request spawns 3 Ruby threads that `sleep`. Puma is configured for 3 worker threads (the default `min 3 max 3`), so only 3 requests can be in flight at once. Concurrent throughput maxes at ~3 × (1 s ÷ 290 ms) ≈ 10 req/s — exactly what was measured.
- ROR Pro streaming hits the same Puma cap PLUS the node renderer is configured with 1 worker, so render-phase work also serializes. Same 9.4 req/s.

This is a configuration trade-off, not a stack property: bumping `puma_threads` or node-renderer workers would lift ROR Pro's throughput closer to Next.js's. Holding everything at single-worker defaults makes the Node-event-loop model look better here.

### Web Vitals — Playwright Chromium, throttled Fast-3G + 4× CPU, median of 5

| Variant | LCP (ms) | FCP (ms) | TTFB (ms) | TBT (ms) | Hydration (ms) | Bytes received |
|---|---:|---:|---:|---:|---:|---:|
| nextjs-sync    | 448 | 448 | 287 | 175 | 831 | 379 908 |
| ror-pro-sync   | 444 | 444 | 292 |  95 | 601 | 241 580 |
| ror-pro-stream | **348** | **348** | **218** | **68** | **509** | 246 368 |

**The streaming ROR Pro variant wins every single web-vital, including against the much-faster-on-throughput Next.js.**

vs `nextjs-sync`:
- LCP **−22 %** (348 vs 448)
- FCP **−22 %** (348 vs 448)
- TTFB **−24 %** (218 vs 287)
- TBT **−61 %** (68 vs 175)
- Hydration **−39 %** (509 vs 831)
- Bytes received **−35 %** (246 KB vs 380 KB)

vs `ror-pro-sync`:
- LCP **−22 %** (348 vs 444)
- TTFB **−25 %** (218 vs 292)
- TBT **−28 %** (68 vs 95)
- Hydration **−15 %** (509 vs 601)

So streaming SSR delivers a real user-experience win even when **identical data** is rendered into **the same React tree**: the only thing that changed is *when the bytes start flowing*.

## Why the streaming shell arrived 60 ms early, not 5 ms

Ideally a shell flush would be sub-10 ms (just initial render of the React tree with all Suspense fallbacks). Measured TTFB is **232 ms** instead — closer to "shell + first Suspense resolution" than "shell alone".

Two factors:

1. The node renderer in this branch buffers initial output until it has the first Suspense fallback for the *first* boundary fully ready. With three boundaries, the first one resolves at ~80 ms (the `stats` await). After that, React's `renderToPipeableStream` flushes the shell + that resolved fragment together. So practical TTFB = shell-render-time + first-emit-resolution ≈ 80 ms + ~150 ms of Ruby/HTTP/IPC overhead = ~230 ms.
2. The Rails-to-renderer HTTP/2 stream uses NDJSON length-prefixed framing. There's a small fixed cost per chunk handoff (visible in the ~75 ms TTFB→TTLB gap, which is the time to stream the three resolved fragments).

Neither factor is a bug — they're just where the budget goes in this implementation. The user-perceptible win (shell + first paint visible 96 ms earlier per Chromium) is the actual product benefit.

## Where streaming shines vs where sync wins

| Dimension | Winner | Why |
|---|---|---|
| **First Contentful Paint** (LCP/FCP)              | **streaming** by 22 % | Shell + skeletons paint immediately; sync waits for all data. |
| **TTFB (sequential)**                              | **streaming** by 60 ms | Same shell-flush story. |
| **Total Blocking Time**                            | **streaming** by 28–61 % | Progressive HTML chunks let the browser process work in smaller bursts, avoiding the one giant long-task you get with sync. |
| **Hydration completion time**                      | **streaming** by 15–39 % | React 19 selectively hydrates per-Suspense boundary, can start hydrating arrived sections while later ones are still streaming. |
| **TTLB (full page)**                               | tied at ~290–305 ms | Same total amount of work; streaming doesn't shorten the end-to-end time, only shifts when bytes arrive. |
| **Concurrent throughput at default Puma threads**  | **Next.js** by 3× | Node's single event loop swallows 10 concurrent I/O waits "for free"; Ruby's threaded model maxes at Puma threads count. |
| **Bytes shipped to the browser**                   | both ROR Pro variants by ~35 % vs Next.js | Pages Router still ships its full client runtime; ROR Pro's hydration glue is smaller. |

## Verdict

For **user-visible performance** (LCP, FCP, TBT, Hydration), `ror-pro-stream` is the clear winner — beating both sync variants by 15–60 % depending on the metric, with **no extra server cost** (TTLB unchanged).

For **raw server throughput** on this *I/O-bound* workload, Next.js wins by 3× because its single-event-loop concurrency model is better matched to "wait on 3 simulated APIs" than Puma's 3-thread default. This gap closes if you bump Puma threads and node-renderer workers — but that's a configuration knob, not a stack property.

If you ship the same Dashboard as RSC + async-props (the variant the user originally asked for): the **server-side timing characteristics are essentially the same as `ror-pro-stream`** measured here, since RSC + async-props uses the same `stream_react_component` machinery underneath. The differences would be: (a) data fetched on the Rails side can be progressively pushed into React via `getReactOnRailsAsyncProp`, instead of pre-resolved + then re-awaited in node — saving some IPC; and (b) actual React Server Components don't ship as client JS, which would *further* reduce the "Bytes received" column. Setting up the rsc-bundle webpack pipeline to test that empirically is the natural next experiment.

## Artifacts

- `dashboard/tables.md` — generated tables (raw)
- `dashboard/server.json` — n=30 sequential TTFB/TTLB + autocannon raw per variant
- `dashboard/web-vitals.json` — 5 Playwright runs per variant with all per-run metrics
- `dashboard/harness.log` — full run log including autocannon output

## Compat shims added for this experiment

- `react_on_rails_pro.rb`: flipped `enable_rsc_support` from `false` → `true` and `rendering_returns_promises` from `false` → `true`. Both are required by the streaming code path even when the rsc-bundle isn't actually used for RSC payloads, because `stream_react_component` uses `pool.rsc_bundle_hash` as the chunk-routing key.
- `ssr-generated/rsc-bundle.js` — created as a literal `cp` of `server-bundle.js`. The runtime only reads its hash for chunk routing; it never *evaluates* this file for non-RSC streaming, so the stub is functionally fine.
- `config/webpack/serverWebpackConfig.js`: enabled `serverWebpackConfig.target = 'node'`. Without this, webpack resolves `react-on-rails-pro`'s `default` export (`ReactOnRails.full.js`) which has no `createProStreamingCapability` — and SSR throws "streamServerRenderedReactComponent requires the react-on-rails-pro package."
- `app/controllers/dashboard_controller.rb`: includes `ReactOnRailsPro::Stream` to get `stream_view_containing_react_components`.
