# RORP vs Next.js performance investigation

This folder is the audit trail of the investigation that closes
[#2 — Investigate bottlenecks at RORP that makes next.js faster](https://github.com/AbanoubGhadban/rsc-benchmar/issues/2).

## TL;DR — where RORP's per-request overhead actually lives

For `/mega_benchmark_traditional` at scale=50 (props ~1.16 MB, HTML ~2.18 MB), median per-request wall time is ~660 ms and breaks down as:

| Phase | Time | % | Layer |
|---|---:|---:|---|
| ActiveRecord (3 selects + pluck) | ~25 ms | 4% | Ruby |
| Props serialization (`JSON.dump`) | ~19 ms | 3% | Ruby |
| ROR Pro overhead (build JS source, form fields) | ~30 ms | 5% | Ruby |
| Bytes on wire (h2c loopback) | ~6 ms | 1% | kernel |
| **`@fastify/formbody` URL-decode of 1.4 MB body** | **~97 ms** | **15%** | Renderer |
| `vm.runInContext` (full React render) | ~12 ms | 2% | Renderer |
| HTTPX-rb HTTP/2 client overhead | ~70 ms | 11% | Ruby |
| **Rails GC + scheduler during await (dominant)** | **~295 ms** | **45%** | Ruby |
| Rails layout/template (2.18 MB HTML wrap) | ~110 ms | 17% | Ruby |

The GC portion was attributed end-to-end in [`02-gc-attribution/report.md`](./02-gc-attribution/report.md). It is **not** caused by Ruby's GC itself (Ruby allocating 1.1 MB JSON costs 1 object, 0 ms GC). It is caused by **`HTTPX::Transcoder::Form.encode`**, which URL-encodes the 1.1 MB JSON body and allocates **516,458 Ruby strings per request** during the percent-escape scan.

## Folders

- **`01-nextjs-vs-ror-pro-baseline/`** — the initial multi-app comparison (`hello`, `dashboard`, `ecommerce`, `mega_benchmark`, RSC variants, streaming variants) showing where the gap exists. Includes:
  - `metrics.json` — aggregated p50/p95/throughput per scenario
  - `compat-diffs.md` — log of non-subject changes
  - Per-scenario summary folders
- **`02-gc-attribution/`** — the dedicated GC root-cause experiment, attributing the ~150 ms/req Ruby GC across (1) nature of Ruby, (2) library design, (3) user code. Includes:
  - `report.md` — final verdict
  - `plan.md`, `metrics.csv`, `iso-metrics.json` — sweep data
  - `bench-ruby-strings.log`, `bench-httpx-encode.log` — pure-Ruby probes
  - `analyze.rb`, `analyze-iso.rb` — log parsers

## Verdict from the GC attribution experiment

| Candidate cause | Median GC contribution | Verdict |
|---|---:|---|
| (1) Nature of Ruby | ~2 ms | **Not the cause.** Ruby's GC is fast at bulk allocations; 1 MB `JSON.generate` = 1 object, 0 ms GC. |
| (2) Library design (ROR Pro + HTTPX-rb form-encoding) | ~91 ms (78% of total) | **Dominant cause.** Form-encoding allocates 500,000+ throwaway strings per request. |
| (3) User code (`pluck.map { hash }`) | ~7.5 ms (6%) | **Minor contributor.** The pattern people normally optimize for is barely a factor. |

## Experimental fixes that fall out

See the experiment-issue tracker:
- `[WIP]` Switch render-request body from form-urlencoded to JSON
- `[WIP]` Decouple props from JS source (pass props as separate JSON field)
- `[WIP]` Cache pre-compiled `vm.Script` for the render template
- `[WIP]` Replace HTTPX-rb persistent plugin with a simpler client
- `[WIP]` Use Oj for JSON in the render path
- `[WIP]` Baseline jemalloc impact on Ruby GC

These will be opened as issues at https://github.com/shakacode/react_on_rails for AI-agent experiments. Each is a demo/measurement, not intended to merge.

## How to reproduce

See [`02-gc-attribution/plan.md`](./02-gc-attribution/plan.md) for the GC experiment.
Top-level harness (for the baseline comparison) is in `apps/ror-rsc/script/`.

Specifically for the GC root cause:

```bash
cd apps/ror-rsc
bundle install

# Restart node renderer + Rails (production mode, RAILS_MAX_THREADS=16)
nvm use 22.12.0
node renderer/node-renderer.js &
REACT_ON_RAILS_SKIP_VALIDATION=true SECRET_KEY_BASE=bench \
  RAILS_LOG_TO_STDOUT=1 RAILS_SERVE_STATIC_FILES=1 \
  RAILS_ENV=production RAILS_MAX_THREADS=16 \
  bundle exec rails server -e production -p 3000 -b 127.0.0.1 &

# Run the sweep
bash ../../docs/perf-investigation/02-gc-attribution/run-sweep.sh ../../docs/perf-investigation/02-gc-attribution
ruby ../../docs/perf-investigation/02-gc-attribution/analyze.rb ../../docs/perf-investigation/02-gc-attribution

# Run the isolation sweep
bash ../../docs/perf-investigation/02-gc-attribution/run-isolation.sh ../../docs/perf-investigation/02-gc-attribution
ruby ../../docs/perf-investigation/02-gc-attribution/analyze-iso.rb ../../docs/perf-investigation/02-gc-attribution

# Or run any pure-Ruby probe
bundle exec ruby ../../docs/perf-investigation/02-gc-attribution/bench-httpx-encode.rb
```
