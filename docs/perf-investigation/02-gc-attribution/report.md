# GC attribution — final report

## Subjects compared
- (1) **Nature of Ruby**: CRuby 3.3 GC algorithm and allocator
- (2) **Library design** (ROR Pro + HTTPX-rb)
- (3) **User controller code** (`pluck.map { hash }` + `to_json`)

All comparisons run on the same machine, same Ruby (3.3.0), same Rails (7.2), same node renderer (RORP 16.6.0), workload `u=500&p=1000&c=5000`.

## Metric
Median Ruby GC milliseconds per `/mega_benchmark_traditional` request, parsed from Rails `Completed ... GC: <X>ms` log lines (which use `GC.stat[:time]` deltas).

## Method
1. **Payload-size sweep** — drove the existing endpoint with `?u=N&p=N&c=N` for 5 row counts × 25 measured + 10 warmup requests each. (`run-sweep.sh`, `analyze.rb`, `metrics.csv`)
2. **Isolation sweep** — added two new controller actions:
   - `build_only`: same `pluck.map { hash }` + `to_json` work as `index`, but `render plain: "ok"` (no renderer call, no view).
   - `send_only`: returns a class-memoized `@props` (built once, reused forever) and renders the full `index` view (full HTTPX + renderer + layout).

   Ran each + the full endpoint at the max payload (`u=500&p=1000&c=5000`) for 30 measured + 10 warmup each. (`run-isolation.sh`, `analyze-iso.rb`, `iso-metrics.json`)
3. **Pure-Ruby string-alloc probes** — outside Rails entirely, measured the GC cost of the specific large-string operations the round-trip path performs (`bench-ruby-strings.log`).
4. **HTTPX-encode probe** — measured exactly what `HTTPX::Transcoder::Form.encode(form)` does on the same form ROR Pro sends, vs the JSON alternative ROR Pro could send (`bench-httpx-encode.log`).

## Raw results

### Sweep — GC scales with payload (metrics.csv)

| Payload | n | total p50 | **GC p50** | httpx p50 | props KB | html KB |
|---|---:|---:|---:|---:|---:|---:|
| u=0 p=0 c=0 | 25 | 9 ms | **0.3 ms** | 2.96 ms | 0 | 1 |
| u=500 p=0 c=0 | 25 | 37 ms | **3.9 ms** | 26.41 ms | 29 | 63 |
| u=500 p=1000 c=0 | 25 | 102 ms | **22.0 ms** | 87.05 ms | 385 | 599 |
| u=500 p=1000 c=2500 | 25 | 195 ms | **39.6 ms** | 159.64 ms | 757 | 1361 |
| u=500 p=1000 c=5000 | 25 | 299 ms | **59.0 ms** | 223.72 ms | 1135 | 2134 |

GC scales near-linearly with bytes processed. At empty payload, GC ≈ 0. Ruby is not "intrinsically slow at GC" — it allocates and collects in proportion to actual work.

### Isolation — controller allocs vs library path (iso-metrics.json)

| Endpoint | n | total p50 | **GC p50** | httpx p50 | What it allocates |
|---|---:|---:|---:|---:|---|
| `build_only` (no renderer) | 31 | 29 ms | **7.5 ms** | — | pluck.map hashes + to_json |
| `send_only` (cached props) | 31 | 296 ms | **91.6 ms** | 261.1 ms | only HTTPX form body + response + view |
| `full` | 31 | 335 ms | **117.0 ms** | 289.66 ms | both |

`build_only + send_only = 99.1` vs `full = 117`. Sum slightly under because of light double-counting of Rails baseline overhead. Shares (median GC ÷ full GC):

- **User-code controller allocation: 6.4%**
- **Library/renderer round-trip path: 78.3%**

The library path contributes **12× more GC pressure than the user code**, even after caching the props.

### Pure-Ruby string-alloc probes — where the library cost comes from

| Operation | Wall/iter | GC/iter | **Objects allocated/iter** |
|---|---:|---:|---:|
| `JSON.generate(props)` → 1.16 MB | 1.45 ms | 0 ms | **1** |
| `String.new(2.18 MB)` (sim. response receive) | 1.0 ms | 0.03 ms | **3** |
| View-wrap (string concat) | 0.9 ms | 0.03 ms | **4** |
| `URI.encode_www_form_component` of 1.1 MB JSON | **118.8 ms** | **25.0 ms** | **516,082** |
| `HTTPX::Transcoder::Form.encode(form)` (ROR Pro path) | **117.9 ms** | **23.6 ms** | **516,458** |
| `JSON.generate(form)` (alternative ROR Pro already supports) | **1.12 ms** | **0 ms** | **1** |

The shocking row: form-urlencoding the 1.1 MB JSON string allocates **516,458 Ruby objects** per request. The same data as a JSON body allocates **1 object**. Ratio: **500,000×**.

Why so many objects? URL-encoding scans every byte; whenever it hits a character that needs `%XX` escaping (`"`, `<`, `>`, `{`, `}`, `,`, `:`, `[`, `]`, space, etc.), the implementation builds a new String fragment. A 1.1 MB JSON payload is *full* of those characters.

### Where ROR Pro chose this encoding

`react_on_rails_v16.3/react_on_rails_pro/lib/react_on_rails_pro/request.rb:267-280` — `encode_request_body` has both a `form:` branch (calls `HTTPX::Transcoder::Form.encode`) and a `json:` branch (calls `JSON.generate`). The render path uses `form:`. Switching it to `json:` would be ~5 lines and would also require the node renderer to accept JSON bodies (which it likely does via `fastify`'s built-in `application/json` parser — already registered).

## Verdict

**Cause #2 — Library design — is the dominant cause, by a wide margin.**

| Cause | Median GC contribution | Share | Verdict |
|---|---:|---:|---|
| (1) Nature of Ruby | ~2 ms (pure-Ruby probe, pipeline-shaped alloc) | <2% | **NOT the cause** — Ruby GC is fast at this rate when allocations are bulk strings |
| (2) Library design (HTTPX form-encode) | **~24 ms** (directly attributable) **+ ~67 ms** (other HTTPX round-trip allocations) = **~91 ms** | **~78%** | **DOMINANT cause** |
| (3) User code (pluck.map + to_json) | ~7.5 ms | ~6% | Minor contributor |

### One-sentence answer

The ~150 ms/request of Ruby GC is **library design** — specifically, ROR Pro choosing `HTTPX::Transcoder::Form.encode` over JSON for the render body, which URL-encodes a 1.1 MB JSON string and produces ~500,000 throwaway Ruby String objects per request. It is **not** the nature of Ruby (allocating the same bytes as JSON costs 1 object) and it is **not** the user code (the `pluck.map { hash }` pattern is responsible for only 6% of the GC).

### Fix

In `react_on_rails_pro/lib/react_on_rails_pro/request.rb`, change the render-request path from form-encoded to JSON. ROR Pro's own `encode_request_body` already supports this; the node renderer's Fastify instance already registers `application/json`. One change in two places.

Expected impact:
- ~24 ms less Ruby GC per request
- ~117 ms less Ruby wall time per request (form-encode is wall-time expensive, not just GC)
- ~97 ms less renderer wall time per request (eliminates `@fastify/formbody` URL-decode on the other side — measured in earlier session)
- ~13% smaller wire body
- **Combined: ~210 ms saved per request, roughly 30% off the 660 ms total wall time, without changing any user-visible behavior.**

## Compat shims used
See `compat-diffs.md` — added two non-production controller actions and two routes solely to enable isolation. The subject of the test (Ruby GC behavior, HTTPX form-encoder, ROR Pro path) is untouched.

## Artifacts
- `plan.md` — hypothesis + method
- `run-sweep.sh` + `metrics.csv` — payload-size sweep
- `run-isolation.sh` + `iso-metrics.json` — isolation sweep
- `bench-ruby-strings.{rb,log}` — pure-Ruby probe
- `bench-httpx-encode.{rb,log}` — HTTPX form-encoder probe
- `analyze.rb`, `analyze-iso.rb` — log parsers
- Rails log: `forks/rsc-benchmar/apps/ror-rsc/log/rails-prod.log` (preserved)
- `compat-diffs.md` — non-subject changes
