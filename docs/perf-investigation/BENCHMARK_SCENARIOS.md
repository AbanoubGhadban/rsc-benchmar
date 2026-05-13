# Pages and scenarios for measuring ROR Pro experiments

Each experimental change (see the [WIP] issues at https://github.com/shakacode/react_on_rails/issues) should be measured across the workload sizes below — different layers of the pipeline have different sensitivities to small/medium/large payloads, sequential vs concurrent load, and time-to-first-byte vs total wall.

## Test pages in this repo

All routes are defined in [`apps/ror-rsc/config/routes.rb`](../../apps/ror-rsc/config/routes.rb). The Next.js counterparts live in `apps/next-traditional/app/` and `apps/next-rsc/app/`.

### Traditional SSR (the main subjects of the experiments)

| Route | Controller | Props size | HTML out | Pattern | When to use |
|---|---|---:|---:|---|---|
| `/hello_world` | `HelloWorldController` | tiny | ~1 KB | render `react_component` with one prop | **Baseline overhead** — pure RORP per-request cost, no DB |
| `/heavy_benchmark_traditional` | `HeavyBenchmarkTraditionalController` | ~120 KB | ~250 KB | DB + `select.map` of 100/50/100 rows | **Medium payload** — where the gap starts to show |
| `/mega_benchmark_traditional` | `MegaBenchmarkTraditionalController` | ~1.16 MB | ~2.18 MB | DB + `pluck.map { hash }` of 500/1000/5000 rows | **Large payload** — where form-encoding / GC dominate |

`mega_benchmark_traditional` also accepts `?u=N&p=N&c=N` to limit how many rows of each table appear in the props (used by the GC sweep). And it has two isolation actions used by the GC root-cause experiment:
- `/mega_benchmark_traditional/build_only` — runs `pluck.map { hash }` + `to_json`, no renderer call
- `/mega_benchmark_traditional/send_only?u=500&p=1000&c=5000` — class-memoized `@props`, full renderer + view

### RSC variants (streaming SSR)

| Route | Controller | What it tests |
|---|---|---|
| `/hello_server` | `HelloServerController` | RSC baseline overhead |
| `/heavy_benchmark` | `HeavyBenchmarkController` | RSC streaming — `stream_view_containing_react_components` |
| `/mega_benchmark` | `MegaBenchmarkController` | Large RSC streaming payload |

Some experiments may not apply to the RSC path (e.g. `vm.Script` cache — issue #3282 — already targets the streaming render entry). When in doubt, run both and report.

### Comparison apps

- **Next.js traditional SSR**: `apps/next-traditional/` (pages: `/heavy`, `/mega`). Run with `npm run start` after `npm run build`.
- **Next.js RSC**: `apps/next-rsc/` (pages: `/heavy`, `/mega`). Same recipe.

The Next.js apps share the same DB schema and seed; they exist so each ROR experiment can be compared against the parallel Next baseline on identical data.

## Three measurement modes (run all three per experiment)

### 1. Sequential timing (latency floor)

Measures median per-request wall time when no other load is on the box. This is what the GC attribution experiment used.

```bash
# Already in docs/perf-investigation/02-gc-attribution/
bash docs/perf-investigation/02-gc-attribution/run-sweep.sh /tmp/after-exp
ruby docs/perf-investigation/02-gc-attribution/analyze.rb /tmp/after-exp
bash docs/perf-investigation/02-gc-attribution/run-isolation.sh /tmp/after-exp-iso
ruby docs/perf-investigation/02-gc-attribution/analyze-iso.rb /tmp/after-exp-iso
```

### 2. Concurrent load (throughput + tail latency)

A change that improves p50 wall but regresses p99 under concurrency is a bad change. Run autocannon at multiple concurrency levels:

```bash
# From the fork root, after npm install
npx autocannon -c 1  -d 15 http://127.0.0.1:3000/hello_world
npx autocannon -c 10 -d 30 http://127.0.0.1:3000/heavy_benchmark_traditional
npx autocannon -c 10 -d 30 http://127.0.0.1:3000/mega_benchmark_traditional
npx autocannon -c 50 -d 30 http://127.0.0.1:3000/mega_benchmark_traditional
# And the Next.js counterparts on whatever port they're started:
npx autocannon -c 10 -d 30 http://127.0.0.1:3001/mega
```

Capture: req/s, p50/p95/p99 latency, error count, timeouts. Compare against baseline before merging the experiment.

### 3. Web vitals via Playwright (TTFB, LCP, hydration)

```js
// Save as bench/web-vitals.mjs in your run dir
import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await (await b.newContext()).newPage();
const t0 = Date.now();
await page.goto('http://127.0.0.1:3000/mega_benchmark_traditional', { waitUntil: 'load' });
const t_load = Date.now() - t0;
const t_lcp = await page.evaluate(() => new Promise(r => {
  new PerformanceObserver(e => r(e.getEntries().pop().startTime))
    .observe({ entryTypes: ['largest-contentful-paint'] });
}));
console.log({ t_load, t_lcp });
await b.close();
```

This catches changes that hurt TTFB even when total wall is fine — relevant for the streaming experiments and the response-size changes.

## Scratch bench scripts (for reference, not in this repo)

A richer set of multi-scale / multi-scenario harnesses lives in a separate scratch tree:

```
/mnt/ssd/my-demos/rsc-benchmark/bench/
  run-scale50.mjs       # focused scale=50 benchmark
  run-highconc.mjs      # c=50 / c=100 concurrent runs
  run-dashboard.mjs     # 3-variant dashboard comparison
  run-shop.mjs          # ecommerce page benchmark
  run-shop-stream.mjs   # streaming vs sync variant
  measure-rss.mjs       # peak RSS sampling during load
  check-correctness.mjs # Playwright correctness checker
  analyze.mjs           # metrics aggregator → markdown tables
```

These were written for a **different app layout** (Next.js on :3000, ROR Pro on :4000, custom routes like `/bench/[scale]` and `/shop/[scale]`). They won't run as-is against this repo — but they're a useful template if an experiment needs richer measurement (RSS, multi-scale, ecommerce-shaped workloads, correctness verification).

## What every experiment report should include

When you finish an experiment, post a comment on its issue with:

| Section | Required content |
|---|---|
| Setup | Ruby version, Node version, machine specs, jemalloc on/off |
| Baseline | `docs/perf-investigation/02-gc-attribution/metrics.csv` numbers (already in this repo) |
| After | Same shape, regenerated after applying the experiment |
| Diff | Total wall delta, GC delta, p95 delta, RSS delta — per page |
| Concurrent | Autocannon req/s + p99 for each page at c=10 and c=50 |
| Correctness | "Pages render byte-equivalent HTML" (manual diff is fine for a demo) |
| Verdict | Go / no-go on opening a production-quality follow-up issue |
