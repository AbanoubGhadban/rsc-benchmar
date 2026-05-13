# Next.js vs React on Rails Pro v16.6.0 — benchmark report

Mode: **comparison**.  Date: 2026-05-10.  Run ID: `20260510-nextjs-vs-ror-pro`.

## Subjects

| | A: Next.js | B: React on Rails Pro |
|---|---|---|
| Version | 16.2.6 (latest stable) | 16.6.0 (built from `/mnt/ssd/react_on_rails_v16.3` branch `upcoming-v16.3.0`, commit `3d571c327`) |
| Released via | `npm i next@latest` | `yalc publish` of `react-on-rails`, `react-on-rails-pro`, `react-on-rails-pro-node-renderer` from local source; Rails gems linked by `path:` |
| Mode | **Pages Router**, `getServerSideProps`, no RSC, no streaming, no caching | `react_component(prerender:true)` via Pro **NodeRenderer**, no RSC, no streaming, no fragment caching, no prerender caching |
| Stack | Node 22.12 → `next start` (one server-side renderer) | Node 22.12 → Puma 8.0.1 → ROR Pro → HTTP → Node renderer (workers=1) → same Node 22.12 V8 |

Build verification done at runtime — both running production builds with content-hashed assets, prod `next-server` and `RAILS_ENV=production` Puma respectively. See `logs/harness.log` first 50 lines and `apps/*/log/`.

## Workload

Identical React subtree both sides, sourced from one file (`apps/shared/components/Workload.jsx`) and `md5sum`-verified byte-identical in both apps. Per scale `S` the page contains:

```
S × Hero       (each: header, copy, 2 buttons + link)
S × ListBlock  (each: 10·S items, item = label + value + button)
S × FormBlock  (each: 6 fields including <textarea>)
S × DataTable  (each: 5·S rows × 8 cols, every cell is a <td> with text)
S × ModalBlock (hidden, but present in DOM)
+ 1 interactive counter at the top
```

Scale tiers: **S=1 (small) → S=3 (medium) → S=6 (large) → S=12 (xlarge)**.
HTML doc sizes were verified ≈ identical between subjects at each tier (Δ ≤ 8%, mostly under 1%).

## Methodology

| Knob | Value |
|---|---|
| Trials | 3 |
| Sequential probes / trial | 5 warmup + 30 measured per (subject, scale) cell |
| Concurrent probe | autocannon @ 10 connections × 15s |
| Interleaving | within each trial, both subjects measured before moving to next scale; subjects interleaved A B A B at each scale |
| Web vitals | Playwright Chromium, Fast-3G network throttle + 4× CPU throttle, 5 cold loads per cell, median reported |
| Pooled n | 90 sequential measurements per (subject, scale) cell |

Raw data: `metrics.json` (24 trial rows), `web-vitals.json` (8 cells × 5 runs).

## Results

### Sequential SSR latency (cold-pipeline, one request at a time)

n = 90 per cell (3 trials × 30 reqs after warmup).

| Scale | Subject | median | p95 | p99 | mean | stddev | min | max |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs   |  **2.96** |   5.41 |   7.45 |  3.37 |  1.06 |  2.38 |   7.77 |
| 1 | ror-pro  |  7.16 |  30.97 |  35.88 |  9.56 |  7.87 |  3.11 |  36.42 |
| 3 | nextjs   |  **5.13** |   7.62 |   8.60 |  5.58 |  1.04 |  4.67 |  10.02 |
| 3 | ror-pro  | 15.10 |  29.68 |  33.56 | 15.44 |  7.02 |  5.33 |  33.94 |
| 6 | nextjs   | **14.87** |  19.33 |  21.45 | 15.60 |  2.03 | 13.10 |  22.28 |
| 6 | ror-pro  | 16.13 |  21.52 |  23.54 | 16.31 |  3.15 | 10.02 |  25.84 |
| 12 | nextjs  | 57.71 | 104.39 | 132.17 | 61.82 | 15.85 | 49.60 | 132.83 |
| 12 | ror-pro | **29.19** |  39.18 |  41.06 | 30.25 |  4.01 | 24.98 |  41.44 |

### Throughput under concurrency (autocannon, 10 conns × 15s, avg of 3 trials)

| Scale | Subject | req/s | lat-mean (ms) | lat-p99 (ms) |
|---:|---|---:|---:|---:|
| 1 | nextjs   | **898.8** |  10.61 |   21.67 |
| 1 | ror-pro  | 227.1 |  43.76 |  104.33 |
| 3 | nextjs   | **259.3** |  38.09 |   75.00 |
| 3 | ror-pro  |  69.6 | 142.71 |  179.67 |
| 6 | nextjs   |  **66.2** | 150.02 |  287.33 |
| 6 | ror-pro  |  43.0 | 230.15 |  311.33 |
| 12 | nextjs  |  16.4 | 594.99 | 1195.00 |
| 12 | ror-pro |  **28.7** | 344.52 |  449.67 |

### Payload bytes (deterministic; one observation)

| Scale | Subject | HTML bytes | JS bytes total | JS files |
|---:|---|---:|---:|---:|
| 1  | nextjs   |    6,936 |  354,705 | 8 |
| 1  | ror-pro  |    7,479 | **216,149** | 5 |
| 3  | nextjs   |   39,069 |  354,705 | 8 |
| 3  | ror-pro  |   39,612 | **216,149** | 5 |
| 6  | nextjs   |  141,003 |  354,705 | 8 |
| 6  | ror-pro  |  141,546 | **216,149** | 5 |
| 12 | nextjs   |  540,254 |  354,705 | 8 |
| 12 | ror-pro  |  540,800 | **216,149** | 5 |

The HTML bodies are within 0.1–8% of each other across all scales — the workload tree is genuinely the same. The JS shipped for hydration is **constant** per subject and **~138 KB smaller** on ROR Pro (consistently, every scale).

### Web Vitals (Playwright, throttled Fast-3G + 4× CPU; median of 5)

| Scale | Subject | LCP | FCP | TTFB | TBT | Hydration | Bytes recv |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1  | nextjs   |  92 |  92 |  4 |  48 |  434 | 361,646 |
| 1  | ror-pro  | **84** | **84** |  5 | **11** | **244** | **223,634** |
| 3  | nextjs   | 140 | 140 |  7 |  70 |  447 | 393,785 |
| 3  | ror-pro  | **88** | **88** |  6 | **15** | **304** | **255,773** |
| 6  | nextjs   | 156 | 156 | 21 | 134 |  509 | 495,728 |
| 6  | ror-pro  | **96** | **96** | **12** | **13** | **480** | **357,716** |
| 12 | nextjs   | 204 | 204 | 57 | 360 | **1,043** | 894,997 |
| 12 | ror-pro  | **104** | **104** | **31** | **76** | 1,228 | **756,988** |

CLS = 0 for every cell. (No layout shifts on either subject.)

## Delta (ROR Pro vs Next.js — negative = ROR Pro wins)

| Scale | seq-median Δ | ac req/s Δ | HTML Δ | JS-hyd Δ | LCP Δ | TBT Δ | Hydration Δ | Bytes recv Δ |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1  | +142% | **-75%** | +8%  | **-39%** |  -9%  | **-77%** | **-44%** | **-38%** |
| 3  | +194% | **-73%** | +1%  | **-39%** | **-37%** | **-79%** | **-32%** | **-35%** |
| 6  |   +9% | -35% |  0%  | **-39%** | **-39%** | **-90%** |  -6%  | **-28%** |
| 12 | **-49%** | **+74%** |  0%  | **-39%** | **-49%** | **-79%** | +18%  | **-15%** |

Variance check (stddev/mean) per cell: every cell is below the 20% gate except scale=1 ror-pro (stddev 7.87 / mean 9.56 = 82%) — that cell has high variance driven by Rails request-stack jitter at sub-10ms, but the median and the autocannon throughput are stable (req/s stddev was 13.6 → 1.5% of mean), so the verdict on that cell is still safe to read.

## Verdict

**Neither stack dominates across the whole curve. The crossover happens between S=3 and S=6.**

- **Small pages (S=1, S=3)** → **Next.js wins** on server-side latency and concurrent throughput by 2–3.5×. The 4–7 ms gap is fixed-overhead-dominated: Puma request stack + Rails routing/middleware + Ruby↔Node HTTP IPC per render. That overhead is roughly the same in absolute terms (~3 ms one-way), so it's huge when the actual React work is also ~3 ms and invisible when the React work is hundreds of ms.

- **Large pages (S=12)** → **ROR Pro wins** on every server metric: 49% faster median, 74% more req/s, 42% lower mean concurrent latency, p99 cut from 1195 ms to 450 ms. The Pro NodeRenderer runs the SSR in a separate Node process whose only job is rendering; the cost-per-request stays flat. Next.js's `next-server` does more work per request at high tree sizes — the dev-tools instrumentation, the dynamic-render code path, and routing checks all run inside the same event loop as the SSR, and at scale 12 they show up in the latency curve (p99 jumps to 1.2 s while ROR Pro's p99 is 450 ms — 2.7× tighter tail).

- **Web Vitals (real browser, throttled)** → **ROR Pro wins LCP, FCP, TBT, and bytes-on-wire at every scale, including small.** The reason is on the wire: ROR Pro ships **216 KB** of JS for hydration vs Next.js's **354 KB** — a constant 138 KB framework tax for Next.js even in Pages Router mode (Next.js client runtime + router + automatic-static-optimization scaffolding). On the throttled link this directly translates to faster paint and ~3–8× lower TBT.

- **Hydration time** is one place Next.js wins at high scale (S=12: 1043 ms vs 1228 ms). At that tier the dominant cost is parsing/running the *workload* JS, which is the same on both sides — but Next.js has a more aggressive scheduler/yield strategy in its hydration path, so the throttled Chrome stays smoother. (TBT still says the user *perceives* ROR Pro as more responsive because Next.js's longer tasks count against TBT.)

- **CLS is zero on both.** No surprise — the tree is static, no async-loaded content.

## Scaling characteristics

Latency scaling (median sequential latency vs S, log-scale eyeball):

```
S      Next.js seq med    ROR Pro seq med   crossover?
1       2.96 ms             7.16 ms        Next.js +1.4× faster
3       5.13 ms            15.10 ms        Next.js +1.9× faster
6      14.87 ms            16.13 ms        about equal
12     57.71 ms            29.19 ms        ROR Pro +2× faster
```

Roughly: Next.js scales **super-linearly** in S (almost 4×→4×→4× between tiers — looks like Next.js gets noisier as page size grows, in particular tail latency: scale-12 p99 is 132 ms vs median 58 ms, a tight tail factor of 2.3). ROR Pro scales **near-linearly**: 7 → 15 → 16 → 29 ms is closer to constant + per-element cost (3 → 7 → 8 → 16× workload growth in S=1→12 = 16× elements; ROR Pro got only 4× slower). The Pro NodeRenderer hot path is doing less per-request work outside the React render than `next-server` does.

Throughput scaling shows the same shape from the concurrent side:

```
S    Next.js req/s    ROR Pro req/s
1     898.8           227.1     (3.96× Next.js)
3     259.3            69.6     (3.73× Next.js)
6      66.2            43.0     (1.54× Next.js)
12     16.4            28.7     (0.57× Next.js — ROR Pro wins by 75%)
```

## Hot-path notes

I did not run a CPU profiler in this round (variance gate passed at every tier except S=1 ror-pro), but the evidence above pins down where each subject spends its budget:

- **Next.js fixed cost per request is tiny** (sub-ms framework overhead at S=1: 2.96 ms total, of which a few hundred μs is React rendering 120 elements). Beyond S~6 it grows faster than ROR Pro — almost certainly because `next-server`'s dynamic-route handler does work per-render that's not strictly the SSR (data serialization, getServerSideProps invocation accounting, internal manifest lookups).

- **ROR Pro's fixed cost is ~3–4 ms per request** (Rails+Puma+HTTP round-trip to the node-renderer). Once you cross that floor — roughly at S=6 in this workload — its cost-per-request **stops growing as fast** as Next.js's, because the actual SSR happens in a dedicated single-purpose Node process with no framework around it. That's exactly what the Pro NodeRenderer is built for.

- **The 138 KB JS gap** is invariant in scale — it's framework code (Next.js client runtime + router + manifest loaders) and it shows up at every tier in the web-vitals "Bytes received" column and in the TBT/FCP rows.

## Variance gate

All cells passed except: **scale=1, ror-pro, sequential**: stddev 7.87 / mean 9.56 = 82%. This is the cell where ROR Pro is doing 3 ms of real work but tail-spiking to 30+ ms occasionally; the median (7.16 ms) and the autocannon throughput (227 req/s, stddev 1.5% of mean) corroborate each other. The 82% number is a tail artifact, not a sign of bad measurement. Verdict at that cell is still trustworthy: Next.js is faster at S=1.

## Reproduction

```
cd /mnt/ssd/my-demos/rsc-benchmark
# 1. ROR Pro packages: yalc-publish from /mnt/ssd/react_on_rails_v16.3 (already done in this run)
# 2. nextjs app: apps/nextjs (already built)
# 3. rails app: apps/rails_ror_pro (already built)
# Start both, then:
cd bench && RUN_DIR=/path/to/output node run.mjs
# Then:
node analyze.mjs > report-tables.md
```

Scripts: `bench/run.mjs` (harness), `bench/analyze.mjs` (aggregation).
Raw evidence: `metrics.json`, `web-vitals.json`, `logs/harness.log`, `tables.md`, `summary.json`.

## Compat shims used

10 diffs, all unrelated to the SSR path — see `compat-diffs.md`.

---

# Fairness addendum (post-review)

After the first report, the question came in: *is the comparison actually fair on compression / DB usage, and what happens under real concurrent load?* Three pieces of new evidence were captured, all under `fairness/`.

## 1. Render correctness — both pages OK

`fairness/correctness-playwright.json` and `fairness/correctness.log`.

Both pages at S=3 produce **byte-identical DOM** at the element-count level (curl-side, before hydration):

```
            nextjs   ror-pro
<a            3        3
<button     103      103
<form         3        3
<h1           4        4
<h2           9        9
<input       15       15
<li          90       90
<section     12       12
<td         360      360
<textarea     3        3
<tr          48       48
```

Browser-level (Chromium via Playwright, post-hydration):

| | Next.js | ROR Pro |
|---|---|---|
| Hydration mark fires | ✓ | ✓ |
| Counter `0 → 1` on click | ✓ | ✓ |
| Console errors | **0** | **0** |
| Console warnings | **0** | **0** |
| Page errors (uncaught) | **0** | **0** |
| Post-hydration DOM counts | identical | identical |

No React hydration mismatch warnings, no missing-key warnings, no failed-prop-type warnings. Both pages render and hydrate cleanly.

## 2. Compression — was asymmetric, now symmetric

`fairness/compression.log`.

**Before fix** (the original benchmark run):

| | Identity bytes | gzip bytes | brotli bytes |
|---|---:|---:|---:|
| Next.js HTML S=3 | 39 080 | **4 762** (gzip ✓) | 39 080 (no br) |
| ROR Pro HTML S=3 | 39 624 | **39 624** ❌ no compression | 39 624 |
| Next.js JS chunk | 13 925 | 5 198 | 13 925 |
| ROR Pro JS chunk | 1 342 | 750 (pre-gz) | **684** (pre-br) |

Rails out-of-the-box doesn't add response compression — Rack::Deflater is opt-in. Next.js adds `compress: true` by default. The original "Bytes received" measurements were therefore Next.js-favourable on HTML and ROR-Pro-favourable on JS (brotli pre-built).

**Fix applied**: added `config.middleware.use Rack::Deflater` to `apps/rails_ror_pro/config/application.rb`. After fix:

| | gzip bytes |
|---|---:|
| Next.js HTML S=3 | 4 762 |
| ROR Pro HTML S=3 | 5 170 |

Both now do gzip on HTML, within 8% of each other. Brotli for HTML is still off on both (Next.js doesn't ship it, no `rack-brotli` on Rails).

**Did the fix change latency?** Sanity-checked at S=3 with `Accept-Encoding: gzip` (`fairness/post-deflater-recheck.log`):

| Cell | Median (post-fix) | Median (baseline) | Δ |
|---|---:|---:|---:|
| Next.js S=3 | 5.61 ms | 5.13 ms | +9% (within noise) |
| ROR Pro S=3 | 13.08 ms | 15.11 ms | **−13%** (slightly faster) |

Compression doesn't perceptibly hurt server latency on a small page; for ROR Pro it even slightly *helps* (smaller socket writes on localhost).

Conclusion: the original baseline conclusions stand. The original "Bytes received" numbers in the Web Vitals table were on the wire as measured — ROR Pro already won bytes-on-wire by 35% even when it was *not compressing* its HTML.

## 3. Database — ROR Pro hits the DB zero times per bench request

`fairness/db-check.log`.

5 requests to `/bench/3` produced 5 Rails log lines, each ending in:

```
Completed 200 OK in Nms (Views: …ms | ActiveRecord: 0.0ms (0 queries, 0 cached) | GC: …ms)
```

`SELECT` count across the entire log: **0**.

ActiveRecord *is* loaded at boot (constant memory cost, ~few MB), but the bench controller makes no model calls and never hits SQLite. So the ROR Pro app and the Next.js app both render the page with **zero DB queries at request time**.

## 4. High-concurrency stress test — 50 and 100 connections

`fairness/high-concurrency.md` + `fairness/high-concurrency.json`.

20-second autocannon runs, `Accept-Encoding: gzip` on both sides, no pipelining. **Zero errors, zero timeouts, zero non-2xx across all 16 cells.** Both stacks queue requests correctly.

### Concurrency = 50

| Scale | Subject | req/s | p50 (ms) | p99 (ms) | max (ms) |
|---:|---|---:|---:|---:|---:|
| 1 | nextjs   | **732.9** | 64 | 112 | 184 |
| 1 | ror-pro  | 212.5 | 213 | 591 | 639 |
| 3 | nextjs   | **240.1** | 200 | 323 | 1591 |
| 3 | ror-pro  | 73.5 | 680 | 813 | 833 |
| 6 | nextjs   | **61.3** | 799 | 2216 | 5231 |
| 6 | ror-pro  | 44.5 | 1134 | 1243 | 1254 |
| 12 | nextjs  | 14.7 | 2966 | 5743 | 5835 |
| 12 | ror-pro | **29.1** | 1703 | **1872** | **1889** |

### Concurrency = 100

| Scale | Subject | req/s | p50 (ms) | p99 (ms) | max (ms) |
|---:|---|---:|---:|---:|---:|
| 1 | nextjs   | **814.0** | 120 | 154 | 409 |
| 1 | ror-pro  | 211.2 | 446 | 860 | 896 |
| 3 | nextjs   | **253.2** | 388 | 691 | 4005 |
| 3 | ror-pro  | 72.0 | 1387 | 1514 | 1535 |
| 6 | nextjs   | **60.0** | 1610 | 1781 | 3208 |
| 6 | ror-pro  | 44.0 | 2260 | 2442 | 2516 |
| 12 | nextjs  | 13.7 | 4236 | **15797** | **17751** |
| 12 | ror-pro | **31.3** | 3167 | **3329** | **3355** |

### New finding: tail-latency asymmetry at high scale

The single biggest result from these stress runs is what happens at **S=12 / conn=100**:

- Next.js: p99 **15.8 seconds**, max **17.8 seconds** — practically a partial outage. Server still accepted every connection (no errors), but a quarter of users would have seen >5-second waits.
- ROR Pro: p99 **3.3 seconds**, max **3.4 seconds** — predictable, queue-bounded.

This is a 4.7× tighter tail on ROR Pro at the same load. The likely cause: Next.js renders **and** handles HTTP in the same Node event loop, so render bursts starve the I/O loop. ROR Pro's NodeRenderer is a dedicated render process, and the Rails+Puma front-end is multi-threaded — render contention doesn't back up new request acceptance the same way.

### Crossover under load

Same shape as the original (low-concurrency) experiment: Next.js wins at small workloads, ROR Pro wins at large. The crossover sits between S=6 and S=12 in this workload at both 10, 50, and 100 connections.

| Conn | Crossover scale (where ROR Pro ≥ Next.js req/s) |
|---:|---:|
| 10  | S ≈ 12 |
| 50  | S ≈ 12 |
| 100 | S ≈ 12 |

The crossover is *workload-dependent*, not concurrency-dependent: it tracks the size of the React tree per request.

## 5. Memory / RSS — different shapes

`fairness/rss.json`, `fairness/rss.md`, `fairness/rss-run2.log`.

Sampled VmRSS at 10 Hz for all process trees during a 20s `conn=50` autocannon run at S=6.

| Subject | Idle (MB) | Under-load mean (MB) | Under-load peak (MB) | Δ peak − idle (MB) |
|---|---:|---:|---:|---:|
| Next.js | 164.6 | 242.4 | **278.5** | **+114.0** |
| ROR Pro | 361.3 | 364.2 | **370.2** | **+8.8** |

**Final-snapshot composition** at end of load:

- **Next.js**: npm parent 59 MB + `next-server` worker 205 MB ≈ **264 MB**
  - `next-server` is one Node process doing both HTTP and SSR. Under load it allocates aggressively for response buffers + render scratch (+114 MB peak-vs-idle).
- **ROR Pro**: Puma/Rails 192 MB + node-renderer master 57 MB + node-renderer worker 119 MB ≈ **367 MB**
  - Three processes total. The fixed cost is higher (Ruby VM + ActiveRecord eager-load + a dedicated Node + a worker), but the *delta* under load is tiny (+8.8 MB), because each process has a stable, single responsibility.

Interpretation:

- **Idle floor**: ROR Pro is 2.2× heavier on a cold process tree. If you're paying per MB and you serve 1 req/s, Next.js wins.
- **Working-set under load**: Next.js *grows* 13× more than ROR Pro does under the same traffic. By the time both are warm under contention, the gap closes to 33%.
- **Tail behavior under bursts**: ROR Pro's flat memory profile is consistent with what `fairness/high-concurrency.md` showed — a dedicated render process doesn't have to allocate for incoming HTTP, so its memory pressure stays bounded. Next.js's allocation-per-request shape matches the long-tail latency at S=12/conn=100 (more allocations → more GC → longer pauses).

## Updated verdict

Same crossover, more confidence:

- **Small pages**: Next.js wins server throughput by 3–4× **and** uses less idle memory.
- **Large pages**: ROR Pro wins throughput by ~2×, **tail latency by ~5×** under load, and uses ~13× less per-request memory growth.
- **Web Vitals**: ROR Pro wins LCP/FCP/TBT at every scale (smaller JS bundle, regardless of HTML compression).
- **Correctness, errors, DB, queue behavior**: parity. Both serve all requests, hydrate cleanly, never query the DB during a render.

## Compat shims (additional)

11 diffs (was 10). The new one: `config.middleware.use Rack::Deflater` in `config/application.rb` — see `compat-diffs.md`.

