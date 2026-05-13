## High-concurrency autocannon (Accept-Encoding: gzip, 20s, pipelining=1)

### Concurrency = 50

| Scale | Subject | req/s | lat-p50 (ms) | lat-p95 (ms) | lat-p99 (ms) | lat-max (ms) | errors | timeouts | non-2xx |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 732.9 | 64 | undefined | 112 | 184 | 0 | 0 | 0 |
| 1 | ror-pro | 212.5 | 213 | undefined | 591 | 639 | 0 | 0 | 0 |
| 3 | nextjs | 240.1 | 200 | undefined | 323 | 1591 | 0 | 0 | 0 |
| 3 | ror-pro | 73.5 | 680 | undefined | 813 | 833 | 0 | 0 | 0 |
| 6 | nextjs | 61.3 | 799 | undefined | 2216 | 5231 | 0 | 0 | 0 |
| 6 | ror-pro | 44.5 | 1134 | undefined | 1243 | 1254 | 0 | 0 | 0 |
| 12 | nextjs | 14.7 | 2966 | undefined | 5743 | 5835 | 0 | 0 | 0 |
| 12 | ror-pro | 29.1 | 1703 | undefined | 1872 | 1889 | 0 | 0 | 0 |

### Concurrency = 100

| Scale | Subject | req/s | lat-p50 (ms) | lat-p95 (ms) | lat-p99 (ms) | lat-max (ms) | errors | timeouts | non-2xx |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | nextjs | 814.0 | 120 | undefined | 154 | 409 | 0 | 0 | 0 |
| 1 | ror-pro | 211.2 | 446 | undefined | 860 | 896 | 0 | 0 | 0 |
| 3 | nextjs | 253.2 | 388 | undefined | 691 | 4005 | 0 | 0 | 0 |
| 3 | ror-pro | 72.0 | 1387 | undefined | 1514 | 1535 | 0 | 0 | 0 |
| 6 | nextjs | 60.0 | 1610 | undefined | 1781 | 3208 | 0 | 0 | 0 |
| 6 | ror-pro | 44.0 | 2260 | undefined | 2442 | 2516 | 0 | 0 | 0 |
| 12 | nextjs | 13.7 | 4236 | undefined | 15797 | 17751 | 0 | 0 | 0 |
| 12 | ror-pro | 31.3 | 3167 | undefined | 3329 | 3355 | 0 | 0 | 0 |

### Delta (ROR Pro vs Next.js — positive = ROR Pro slower / lower throughput)

| Scale | Conns | req/s Δ | lat-p50 Δ | lat-p99 Δ |
|---:|---:|---:|---:|---:|
| 1 | 50 | -71.0% | 232.8% | 427.7% |
| 3 | 50 | -69.4% | 240.0% | 151.7% |
| 6 | 50 | -27.4% | 41.9% | -43.9% |
| 12 | 50 | 98.0% | -42.6% | -67.4% |
| 1 | 100 | -74.1% | 271.7% | 458.4% |
| 3 | 100 | -71.6% | 257.5% | 119.1% |
| 6 | 100 | -26.7% | 40.4% | 37.1% |
| 12 | 100 | 128.1% | -25.2% | -78.9% |