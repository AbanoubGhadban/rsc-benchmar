# RSC SSR Benchmark Results

**Date:** 2026-05-10  
**Database:** PostgreSQL (`rsc_bench`)  
**Data:** 1000 users, 2000 posts, 10000 comments  
**Caching:** Disabled (`prerender_caching = false`)

## Test URLs

| Framework | Mode | URL |
|-----------|------|-----|
| Next.js 16.2.6 | RSC Streaming | http://localhost:3001/mega |
| Next.js 16.2.6 | Traditional SSR | http://localhost:3002/mega |
| React on Rails Pro 16.6.0 | Streaming (async props) | http://localhost:3000/mega_benchmark |
| React on Rails Pro 16.6.0 | Traditional SSR | http://localhost:3000/mega_benchmark_traditional |

## Results (10 runs, warm)

| Framework | Mode | TTFB | Total |
|-----------|------|------|-------|
| Next.js | RSC Streaming | **9ms** | 278ms |
| RoRP | Streaming | 22ms | 684ms |
| Next.js | Traditional | 115ms | **117ms** |
| RoRP | Traditional | 600ms | 601ms |

## Analysis

### TTFB Comparison
- Next.js RSC: 9ms (best)
- RoRP Streaming: 22ms (2.4x slower than Next.js RSC)
- Next.js Traditional: 115ms
- RoRP Traditional: 600ms (5.2x slower than Next.js Traditional)

### Total Time Comparison
- Next.js Traditional: 117ms (best)
- Next.js RSC: 278ms
- RoRP Streaming: 684ms (2.5x slower than Next.js RSC)
- RoRP Traditional: 601ms

### Streaming Benefit
- RoRP Streaming TTFB 27x better than RoRP Traditional (22ms vs 600ms)
- Next.js RSC TTFB 13x better than Next.js Traditional (9ms vs 115ms)

## Key Findings

1. **RoRP streaming works** - provides 27x better TTFB vs traditional
2. **Next.js faster overall** - 2-5x depending on mode
3. **Overhead scales with data** - larger pages = bigger gap
4. **Node renderer overhead** - Rails ↔ Node IPC adds latency per request

## Configuration

### Next.js RSC (`/mega`)
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### Next.js Traditional (`/mega`)
```typescript
// getServerSideProps - no caching
```

### RoRP
```ruby
# config/initializers/react_on_rails_pro.rb
config.prerender_caching = false
```

## Response Sizes

| Endpoint | Size |
|----------|------|
| Next.js RSC | 5.77 MB |
| Next.js Traditional | 3.47 MB |
| RoRP Streaming | 4.33 MB |
| RoRP Traditional | 3.47 MB |

## Environment

- macOS Darwin 25.3.0
- Ruby 3.3.6
- Node.js (Next.js 16.2.6, RoRP Node Renderer)
- PostgreSQL
- React on Rails Pro 16.6.0
