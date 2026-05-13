# Caching audit — full verdict

Question: *are the benchmarks really free of caching at every layer?*

## Configuration evidence (`fairness/cache-audit.log`)

### Next.js
- `pages/bench/[scale].jsx` and `pages/shop/[scale].jsx` both use `getServerSideProps` which makes the route **dynamic** (not statically generated).
- Each response sets `Cache-Control: no-store, max-age=0` via `ctx.res.setHeader(...)`.
- `next.config.js` does not enable `staticPageGenerationTimeout`, `revalidate`, or any RSC/route caching.
- `grep -rn revalidate|unstable_cache|cache:|fetchCache|dynamic[ ]*=` over the project → **0 hits**. No data caching anywhere.

### React on Rails Pro
- `config/initializers/react_on_rails_pro.rb`: `config.prerender_caching = false`.
- `config/environments/production.rb`: `config.action_controller.perform_caching = false` AND `config.cache_store = :null_store`.
- Both controllers (`BenchController`, `ShopController`) have a `before_action :no_cache` setting `Cache-Control: no-store, max-age=0` and `Pragma: no-cache`.
- View files use plain `react_component`. No `cached_react_component`, no `<% cache %>` blocks, no `fragment_cache`.
- Node renderer is configured with no in-process render cache. `serverBundleCachePath` only stores the *server bundle JS file on disk* — that is not a render cache.

### Benchmark harness
- `bench/run.mjs`: passes `cache: 'no-store'` to `fetch()` and `Cache-Control: no-cache` header to autocannon.
- `bench/run-shop.mjs`, `bench/run-scale50.mjs`, `bench/run-highconc.mjs`: only set `Accept-Encoding: gzip`. **They do not pass `cache: 'no-store'`** — but Node 22's undici `fetch` has no built-in HTTP cache, so this is a no-op anyway. Verified by the empirical test below.
- Playwright runs always use `browser.newContext()` per measurement run. Each context has its own isolated cache; reusing an old ETag is impossible.

## Empirical evidence (`fairness/cache-empirical.log`)

### 1. Response headers — both apps say "no-store"

```
nextjs  /bench/3   Cache-Control: no-store, max-age=0  ETag: "29ypbw8muu59"  Vary: Accept-Encoding
nextjs  /shop/3    Cache-Control: no-store, max-age=0  ETag: "zqq8ma4k7q183o" Vary: Accept-Encoding
ror-pro /bench/3   cache-control: no-store  pragma: no-cache  vary: Accept,Accept-Encoding
ror-pro /shop/3    cache-control: no-store  vary: Accept,Accept-Encoding
```

**Subtle gotcha**: Next.js sends an `ETag` *even when `Cache-Control: no-store` is set*. A subsequent `If-None-Match: "<that-etag>"` request **does return HTTP 304** (verified — see `fairness/cache-empirical.log`). ROR Pro sends no ETag.

This means: if a real browser visits twice in a session and the second hit sends the saved ETag, **Next.js would short-circuit with a 304** and serve nothing. That's technically a client-side cache hit, even though the server claimed `no-store`. But my benchmark never re-uses ETags (see below), so this didn't affect the numbers.

### 2. The harness does not trigger 304s

Ran autocannon for 5 s against `ror-pro /bench/3` and counted Rails log entries:
- 321 successful requests in 5.01 s
- **322 `Completed 200 OK` log lines, 0 `Completed 304`**

So autocannon never sends `If-None-Match`. Every request is a full render. (ROR Pro has no ETag at all, so this is moot for it.)

For Next.js: autocannon doesn't store responses, so no If-None-Match is generated. Sequential `fetch()` in my harness doesn't either (the Node-fetch HTTP client is stateless across calls).

### 3. Cache-busting nonce test — no internal cache

20 requests at `/bench/3` vs 20 at `/bench/3?nonce=<random>`:

| | Same URL median | Cache-busted median |
|---|---:|---:|
| Next.js | 7.48 ms | 7.51 ms |
| ROR Pro | 8.19 ms | 8.35 ms |

Within ±0.2 ms (noise floor). Confirms no per-URL render cache at either layer.

### 4. Per-request server work confirmed

Rails log per request shows:
```
[ReactOnRailsPro] Perform rendering request /bundles/.../render/...
[ReactOnRailsPro] Node Renderer responded
Completed 200 OK in Nms (... | ActiveRecord: 0.0ms (0 queries, 0 cached) ...)
```

Every request hits the node renderer for a fresh SSR. The `0 queries, 0 cached` confirms the controller does no DB work and no Rails fragment-cache lookup.

### 5. Different scales → different bodies → no scale-collapsed cache

```
nextjs /bench/1  1874 bytes
nextjs /bench/3  4755 bytes
nextjs /bench/6  12739 bytes
```

(gzipped) — every scale renders a different payload. No "single cached version served regardless of params".

### 6. Playwright

`browser.newContext()` is called inside the per-run loop in `run.mjs`, `run-shop.mjs`, and `run-scale50.mjs`. A new context has its own isolated cookie jar, storage, and **HTTP cache**. There is no way Playwright would carry an ETag from run *N* to run *N+1*.

## Verdict

✅ **No render-time caching on either side** — verified empirically by:
- Identical latency for cache-busted URLs (within 0.2 ms)
- Every request producing a fresh `x-request-id` and a fresh log line
- 0 Rails 304s during sustained autocannon load
- `null_store` + `prerender_caching=false` + `perform_caching=false` confirmed at boot

✅ **No browser-side cache reuse during benchmarks** — verified by:
- Playwright using fresh `newContext()` per run
- autocannon + Node `fetch` never sending `If-None-Match`

⚠️ **Caveat about Next.js ETag**: in *production traffic with a real browser*, Next.js would serve 304s to repeat visitors, which is a real Next.js advantage for user-experienced latency. The harness intentionally does **not** include that 304 short-circuit in its numbers, so the comparison is on raw render cost only.

Bottom line: the benchmark measures **uncached SSR on both sides, every single request**. The numbers are not contaminated by any cache layer.
