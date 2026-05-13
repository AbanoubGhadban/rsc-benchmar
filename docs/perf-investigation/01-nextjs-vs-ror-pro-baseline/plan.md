# Plan: Next.js (no RSC, no caching) vs React on Rails Pro v16.3.0 — comparison mode

Date: 2026-05-10  •  Run ID: 20260510-nextjs-vs-ror-pro

## Subjects

| | Next.js | React on Rails Pro |
|---|---|---|
| Source | `npm i next@latest react@18 react-dom@18` (latest released stable) | `/mnt/ssd/react_on_rails_v16.3` branch `upcoming-v16.3.0` |
| Router/mode | **Pages Router**, getServerSideProps (so no caching, no RSC) | Rails 7 + ROR Pro `react_component` with Pro node renderer |
| SSR runtime | Node (Next.js built-in) | Node renderer (`react-on-rails-pro-node-renderer`) — separate Node process called from Rails |
| Streaming/RSC | **disabled** (Pages Router has neither) | **disabled** — no `rsc_payload` / `stream_react_component` calls; classic `react_component` only |
| Caching | **disabled** (no `revalidate`, no `fetch` cache, no `Cache-Control: s-maxage`) | **disabled** — no Pro fragment caching, no fragment_cache, no HTTP caching |
| Build | `next build && next start -p 3000` (production) | `RAILS_ENV=production assets:precompile`, `rails s -e production -p 4000` + node-renderer on :3800 |

Both run on same host (Linux x86_64, 12-core, 31Gi RAM, Node 18.17 — bumped to 20.19 if Next.js latest requires it).

## Workload (same React subtree both sides)

A single page that mounts a "mixed real-world" composite scaled by integer `S`:

```
<Page>
  Hero × S
  List × S            (each list has 10·S items)
  Form × S            (each form has 6 fields)
  DataTable × S       (each table is 8 cols × 5·S rows)
  Modal × S           (closed; rendered into tree)
</Page>
```

Total React elements grow roughly cubically in S for tables/lists. Scale tiers:

| Tier | S | Approx element count |
|---|---|---|
| small | 1 | ~120 |
| medium | 3 | ~1,300 |
| large | 6 | ~5,000 |
| xlarge | 12 | ~20,000 |

The same TSX module is shared between both apps via a sibling `shared/` workspace, so the subjects render *byte-identical* React trees.

## Metrics

1. **Server SSR latency (sequential, n=30 per tier after 5 warmup)** — full HTTP response time on `curl --silent -o /dev/null -w '%{time_total}'`. Reported: median, p95, p99, stddev.
2. **Server throughput (autocannon, concurrency=10, duration=15s)** — req/s, mean/p99 latency.
3. **HTML doc bytes** + **total JS bytes hydration cost** (sum of `<script src>` from the doc).
4. **Web Vitals via Playwright** (Chromium headless, throttled to "Fast 3G" + 4× CPU slowdown for realism; n=5 cold loads per tier, reported median):
   - LCP, FCP, TTFB, TBT, CLS
   - Hydration completion time (custom: `performance.mark('hydrated')` injected on both apps)
   - Total bytes received (CDP `Network.dataReceived`)

## Run ordering

Interleaved A B A B per measurement to avoid thermal/cache bias. 3 trials. Two apps stay running across all tiers (we just re-build the page for the next tier — keeps Node JIT warm and is the same condition for both).

## Auto-fix budget

Allowed without asking:
- `pnpm install`, `bundle install`, `nvm use`, `yalc add`, deleting prior build artifacts
- Picking free ports if 3000/4000/3800 busy

Block-ask required for:
- Any sudo / apt install
- Any cloud account
- Switching ROR branches

## Success criterion

This is not a pass/fail experiment. Success = a `metrics.json` with paired observations at every (subject, tier) cell, with stddev/mean < 20% per cell, and a `report.md` whose verdict references those numbers, not source code.

## Hypothesis (to be tested)

H1: For small/medium pages, Next.js will have lower TTFB & per-request latency than ROR Pro because ROR Pro has Rails request stack + Ruby↔Node IPC overhead.
H2: As tier grows, the per-request difference will shrink because rendering cost dominates IPC overhead, and both run V8 SSR.
H3: Web vitals (LCP, FCP) will track TTFB closely — same hydration shape on both sides — but ROR Pro may ship slightly more JS at runtime (ROR client glue). Total JS for the user-tree itself should be similar.
