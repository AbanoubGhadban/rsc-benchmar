# Dashboard streaming benchmark

Three render strategies, identical workload (3 fake "API" fetches @ 80/180/280 ms in parallel, 24 orders + 48 product recommendations + 4 KPI cards).

## Sequential (curl, n=30 after 5 warmup, Accept-Encoding: gzip)

| Variant | TTFB median (ms) | TTFB p95 | TTLB median (ms) | TTLB p95 | bytes (gzip) |
|---|---:|---:|---:|---:|---:|
| nextjs-sync | 289.47 | 295.75 | 289.72 | 296.68 | 4,225 |
| ror-pro-sync | 296.91 | 314.12 | 297.00 | 314.23 | 4,634 |
| ror-pro-stream | 231.89 | 246.73 | 305.61 | 317.07 | 5,285 |

## Autocannon (c=10, 15s, gzip)

| Variant | req/s | p50 (ms) | p95 (ms) | p99 (ms) | errors | timeouts |
|---|---:|---:|---:|---:|---:|---:|
| nextjs-sync | 30.00 | 330 | undefined | 340 | 0 | 0 |
| ror-pro-sync | 9.60 | 968 | undefined | 1243 | 0 | 0 |
| ror-pro-stream | 9.40 | 1002 | undefined | 1280 | 0 | 0 |

## Web Vitals (Playwright Chromium, Fast-3G + 4× CPU, median of 5)

| Variant | LCP (ms) | FCP (ms) | TTFB (ms) | TBT (ms) | Hydration (ms) | Bytes received |
|---|---:|---:|---:|---:|---:|---:|
| nextjs-sync | 448 | 448 | 287 | 175 | 831 | 379,908 |
| ror-pro-sync | 444 | 444 | 292 | 95 | 601 | 241,580 |
| ror-pro-stream | 348 | 348 | 218 | 68 | 509 | 246,368 |