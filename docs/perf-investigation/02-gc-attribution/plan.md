# GC attribution experiment

## Question
The Rails `Completed` line reports ~150 ms of GC time per `/mega_benchmark_traditional` request. Which of the following layers is the dominant cause?

1. **Nature of Ruby**: CRuby's mark-and-sweep GC pauses at this allocation rate regardless of who allocates
2. **Library design** (ROR Pro / httpx-rb): form-urlencoded encoding + HTTPX-rb response buffering forces unnecessary allocations
3. **User controller code**: the `pluck.map { hash }` pattern + `to_json` of a large structure churn 6,500+ short-lived hashes per request

## Hypothesis
GC time scales near-linearly with payload size. Two sub-hypotheses, mutually exclusive:
- **H_user**: GC drops to baseline (~5–20 ms) when `u=0&p=0&c=0` (no hashes built, no big body, no big response). User code is the dominant cause.
- **H_lib**: GC stays roughly constant across payload sizes because the renderer round trip path always allocates a 1.4 MB body + 2.18 MB response on the Ruby side, regardless of how many hashes the controller built. Library/round-trip path is the dominant cause.

## Success criterion
Run the controller with 5 sweep points:
- `u=0&p=0&c=0` (no data)
- `u=500&p=0&c=0` (only users — 500 hashes)
- `u=500&p=1000&c=0` (users + posts — 1,500 hashes)
- `u=500&p=1000&c=2500` (half comments — 4,000 hashes)
- `u=500&p=1000&c=5000` (full — 6,500 hashes)

Capture `Completed ... GC: <X>ms` per request, n≥20 per point after warmup. Compute median GC time per point.

If GC at u=0&p=0&c=0 is ≪ GC at full (e.g. ≤20% of full), **H_user wins**.
If GC at u=0&p=0&c=0 is within 50% of GC at full, **H_lib wins**.
If linear scaling with row count, both contribute proportionally.

## Method
1. Restart node-renderer (port 3800) and Rails in prod mode (port 3000, RAILS_MAX_THREADS=16)
2. Warm each sweep point with 10 requests
3. Measure each sweep point with 20 requests
4. Parse rails-prod.log for `Completed 200 OK in <total>ms ... GC: <gc>ms` and `[INSTR-RORP-NETWORK] httpx_round_trip_ms=<rt>` per request
5. Per sweep point: median total / median GC / median round-trip
6. Verdict based on the GC curve

## Env
- Ruby 3.3.0 with default GC settings
- Node v22.12.0 (renderer) / v18.17.0 (host shell default — irrelevant)
- Linux 6.8.0
- ROR Pro v16.6.0 (local clone at /mnt/ssd/react_on_rails_v16.3) with INSTR-RORP-NETWORK + INSTR-RORP-BODY patches
- Rails 7.2, Puma in production mode, RAILS_MAX_THREADS=16
- Renderer = `react-on-rails-pro-node-renderer` v16.6.0, workersCount=3
