# Scale=50 benchmark — both pages, both stacks

## Page sizes (gzip on the wire, bytes)

| Page | Next.js | ROR Pro | Δ |
|---|---:|---:|---:|
| /bench/50 | 9,340,241 | 9,340,787 | 0.0% |
| /shop/50 | 213,774 | 214,382 | 0.3% |

## Server sequential latency (n=15, gzip)

| Page | Subject | median (ms) | p95 (ms) | p99 (ms) | mean | stddev |
|---|---|---:|---:|---:|---:|---:|
| /bench/50 | nextjs | 1781.30 | 2483.78 | 2555.75 | 1999.01 | 298.66 |
| /bench/50 | ror-pro | 1012.55 | 1104.44 | 1181.17 | 1020.09 | 58.83 |
| /shop/50 | nextjs | 30.94 | 46.56 | 58.09 | 34.29 | 7.80 |
| /shop/50 | ror-pro | 22.99 | 27.19 | 27.59 | 23.67 | 2.08 |

## Autocannon — conn=10, 15s

| Page | Subject | req/s | p50 | p95 | p99 | max | errors | timeouts |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| /bench/50 | nextjs | 0.00 | 0 | undefined | 0 | 0 | 0 | 0 |
| /bench/50 | ror-pro | 1.20 | 6937 | undefined | 9421 | 9421 | 0 | 0 |
| /shop/50 | nextjs | 40.00 | 223 | undefined | 353 | 632 | 0 | 0 |
| /shop/50 | ror-pro | 38.60 | 246 | undefined | 342 | 358 | 0 | 0 |

## Web Vitals (Playwright Chromium, Fast-3G + 4× CPU, median of 3)

| Page | Subject | LCP | FCP | TTFB | TBT | Hydration | Bytes received |
|---|---|---:|---:|---:|---:|---:|---:|
| /bench/50 | nextjs | 1824 | 1768 | 1667 | 15674 | 20459 | 9,695,182 |
| /bench/50 | ror-pro | 1376 | 1376 | 1201 | 16023 | 20440 | 9,557,089 |
| /shop/50 | nextjs | 280 | 280 | 42 | 533 | 1157 | 594,789 |
| /shop/50 | ror-pro | 276 | 276 | 23 | 499 | 1080 | 457,105 |