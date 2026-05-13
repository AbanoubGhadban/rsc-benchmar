## Ecommerce page: server-side metrics

### Sequential latency (n=90/cell, Accept-Encoding: gzip)

| Scale | Subject | median (ms) | p95 (ms) | p99 (ms) | mean (ms) | stddev | bytes |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 5.97 | 9.12 | 10.45 | 6.73 | 1.36 | 36560 |
| 1 | ror-pro | 17.67 | 53.57 | 76.00 | 25.32 | 22.02 | 37165 |
| 3 | nextjs | 8.54 | 11.92 | 18.90 | 9.06 | 2.02 | 57156 |
| 3 | ror-pro | 15.35 | 23.40 | 25.80 | 16.05 | 4.43 | 57761 |
| 6 | nextjs | 9.68 | 11.25 | 21.29 | 10.22 | 2.64 | 67536 |
| 6 | ror-pro | 11.19 | 23.75 | 25.68 | 13.48 | 4.60 | 68141 |
| 12 | nextjs | 11.79 | 19.11 | 32.06 | 12.77 | 3.58 | 87506 |
| 12 | ror-pro | 12.56 | 22.42 | 25.23 | 14.37 | 3.98 | 88114 |

### Autocannon — concurrency = 10 (single trial × 15s)

| Scale | Subject | req/s | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | errors | timeouts |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 209.3 | 43 | undefined | 95 | 124 | 0 | 0 |
| 1 | ror-pro | 74.1 | 137 | undefined | 168 | 177 | 0 | 0 |
| 3 | nextjs | 148.9 | 61 | undefined | 126 | 151 | 0 | 0 |
| 3 | ror-pro | 66.1 | 152 | undefined | 198 | 211 | 0 | 0 |
| 6 | nextjs | 131.2 | 74 | undefined | 120 | 173 | 0 | 0 |
| 6 | ror-pro | 95.1 | 102 | undefined | 191 | 230 | 0 | 0 |
| 12 | nextjs | 102.9 | 94 | undefined | 145 | 174 | 0 | 0 |
| 12 | ror-pro | 80.3 | 122 | undefined | 200 | 249 | 0 | 0 |

### Autocannon — concurrency = 50 (single trial × 15s)

| Scale | Subject | req/s | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | errors | timeouts |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 233.5 | 207 | undefined | 295 | 367 | 0 | 0 |
| 1 | ror-pro | 65.1 | 760 | undefined | 874 | 896 | 0 | 0 |
| 3 | nextjs | 156.9 | 314 | undefined | 498 | 517 | 0 | 0 |
| 3 | ror-pro | 66.5 | 743 | undefined | 868 | 876 | 0 | 0 |
| 6 | nextjs | 133.7 | 365 | undefined | 555 | 605 | 0 | 0 |
| 6 | ror-pro | 73.5 | 681 | undefined | 846 | 855 | 0 | 0 |
| 12 | nextjs | 101.4 | 478 | undefined | 775 | 786 | 0 | 0 |
| 12 | ror-pro | 80.9 | 611 | undefined | 747 | 780 | 0 | 0 |

### Autocannon — concurrency = 100 (single trial × 15s)

| Scale | Subject | req/s | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | errors | timeouts |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 230.1 | 424 | undefined | 555 | 716 | 0 | 0 |
| 1 | ror-pro | 64.5 | 1548 | undefined | 1633 | 1659 | 0 | 0 |
| 3 | nextjs | 151.7 | 650 | undefined | 1028 | 1298 | 0 | 0 |
| 3 | ror-pro | 66.4 | 1483 | undefined | 1617 | 1636 | 0 | 0 |
| 6 | nextjs | 131.6 | 750 | undefined | 1004 | 1181 | 0 | 0 |
| 6 | ror-pro | 77.0 | 1294 | undefined | 1495 | 1526 | 0 | 0 |
| 12 | nextjs | 99.1 | 963 | undefined | 1294 | 1604 | 0 | 0 |
| 12 | ror-pro | 82.2 | 1202 | undefined | 1473 | 1512 | 0 | 0 |

## Web Vitals (Playwright Chromium, Fast-3G + 4× CPU, median of 5)

| Scale | Subject | LCP (ms) | FCP (ms) | TTFB (ms) | TBT (ms) | CLS | Hydration (ms) | Bytes received |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 244 | 244 | 6 | 230 | 0.000 | 613 | 414,079 |
| 1 | ror-pro | 236 | 236 | 8 | 153 | 0.000 | 460 | 276,392 |
| 3 | nextjs | 244 | 244 | 10 | 304 | 0.000 | 703 | 434,955 |
| 3 | ror-pro | 256 | 256 | 9 | 190 | 0.000 | 536 | 297,268 |
| 6 | nextjs | 240 | 240 | 9 | 300 | 0.000 | 706 | 445,541 |
| 6 | ror-pro | 252 | 252 | 12 | 204 | 0.000 | 558 | 307,854 |
| 12 | nextjs | 244 | 244 | 12 | 309 | 0.000 | 757 | 465,921 |
| 12 | ror-pro | 252 | 252 | 14 | 265 | 0.000 | 622 | 328,237 |