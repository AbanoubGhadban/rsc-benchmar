# Shop streaming benchmark — 5 variants

All identical EcommercePage. Sync variants accept `?delay=N` to add an N-ms server-side wait before rendering. Stream variant uses ROR Pro `stream_react_component` with 120/240ms `await new Promise(setTimeout)` inside React async Suspense sections.

## Sequential (curl, n=30 after 5 warmup, Accept-Encoding: gzip)

| Variant | TTFB median (ms) | TTFB p95 | TTLB median (ms) | TTLB p95 | bytes (gzip) |
|---|---:|---:|---:|---:|---:|
| nextjs-fast | 7.36 | 10.84 | 7.53 | 11.04 | 8,112 |
| ror-pro-fast | 17.48 | 42.01 | 17.58 | 42.09 | 8,534 |
| nextjs-slow | 263.58 | 274.00 | 264.13 | 274.69 | 8,122 |
| ror-pro-slow | 256.86 | 269.40 | 256.95 | 269.55 | 8,542 |
| ror-pro-stream | 216.76 | 236.28 | 254.49 | 275.47 | 9,195 |

## Autocannon (c=10, 12s, gzip)

| Variant | req/s | p50 (ms) | p95 (ms) | p99 (ms) | errors | timeouts |
|---|---:|---:|---:|---:|---:|---:|
| nextjs-fast | 186.84 | 49 | undefined | 94 | 0 | 0 |
| ror-pro-fast | 106.92 | 91 | undefined | 179 | 0 | 0 |
| nextjs-slow | 30.84 | 326 | undefined | 339 | 0 | 0 |
| ror-pro-slow | 10.75 | 842 | undefined | 1152 | 0 | 0 |
| ror-pro-stream | 11.34 | 814 | undefined | 1043 | 0 | 0 |

## Web Vitals (Playwright Chromium, Fast-3G + 4× CPU, median of 5)

| Variant | LCP (ms) | FCP (ms) | TTFB (ms) | TBT (ms) | Hydration (ms) | Bytes received |
|---|---:|---:|---:|---:|---:|---:|
| nextjs-fast | 236 | 236 | 9 | 172 | 511 | 448,282 |
| ror-pro-fast | 244 | 244 | 8 | 133 | 395 | 310,484 |
| nextjs-slow | 452 | 452 | 248 | 179 | 746 | 448,296 |
| ror-pro-slow | 472 | 472 | 249 | 141 | 667 | 310,511 |
| ror-pro-stream | 364 | 364 | 217 | 107 | 484 | 320,874 |