# `bench/` — measurement tooling for the perf experiments

Small, dependency-light scripts for the experimental issues at
https://github.com/shakacode/react_on_rails (issues #3280–#3285).

## What's here

| File | What it does |
|---|---|
| `cross-page-autocannon.mjs` | Runs autocannon over hello/heavy/mega + RSC variants + Next.js counterparts, writes one JSON file. Use **before** and **after** an experiment, compare. |

## Quick start

```bash
# From the fork root
npm install   # picks up autocannon (already in package.json)

# Start the renderer + Rails + (optionally) Next.js
# Rails on :3000, Next.js on :3001 by convention
node apps/ror-rsc/renderer/node-renderer.js &
(cd apps/ror-rsc && bundle exec rails s -e production -p 3000) &
# Optionally: (cd apps/next-traditional && PORT=3001 npm run start) &

# Capture baseline
mkdir -p /tmp/exp-1
node bench/cross-page-autocannon.mjs --concurrency=10 --duration=30 --out=/tmp/exp-1/before

# Apply the experiment (the change described in the ROR issue you're working on)
# ... rebuild gem / yalc push renderer + ROR packages, restart Rails + renderer ...

# Capture after
node bench/cross-page-autocannon.mjs --concurrency=10 --duration=30 --out=/tmp/exp-1/after

# Diff the JSON files manually or via jq
diff <(jq -S . /tmp/exp-1/before/cross-page-*.json) <(jq -S . /tmp/exp-1/after/cross-page-*.json)
```

## Concurrency sweep

If your experiment might affect tail latency or concurrent throughput:

```bash
node bench/cross-page-autocannon.mjs --sweep --duration=20 --out=/tmp/exp-1/sweep-after
# runs c=1, c=10, c=50 over every page
```

## What this does NOT cover (and what you also need to run)

- **GC time per request** — only visible in the Rails log's `Completed ... GC: <X>ms` line. Use `docs/perf-investigation/02-gc-attribution/run-sweep.sh` + `analyze.rb` for that.
- **Isolation between controller-alloc and library-path-alloc** — use `docs/perf-investigation/02-gc-attribution/run-isolation.sh`.
- **Web vitals (TTFB, LCP, hydration)** — see the Playwright snippet in `docs/perf-investigation/BENCHMARK_SCENARIOS.md`.
- **Peak RSS during load** — `bench/measure-rss.mjs` exists in scratch; port it if needed.
- **Correctness** — verify by manual diff or by writing a 20-line Playwright check; both stacks should produce byte-equivalent HTML.

The full measurement plan for each experiment is in `docs/perf-investigation/BENCHMARK_SCENARIOS.md`.
