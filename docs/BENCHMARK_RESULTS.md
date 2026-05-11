# RSC Benchmark Results

## Overview

This document summarizes performance benchmarks comparing React Server Components (RSC) implementations across frameworks:

- **Next.js 15** with RSC
- **React on Rails Pro** with RSC
- Traditional SSR baselines for each

All tests run on same hardware, same app logic, production builds.

## Test Environment

- **Hardware**: Apple M1, 8GB RAM
- **Node**: 22.12.0
- **Ruby**: 3.3.6
- **Tool**: Lighthouse CLI (headless Chrome)
- **Date**: 2026-05-10

## Homepage Results

| Metric | Next.js RSC | RORP RSC | Delta | Winner |
|--------|-------------|----------|-------|--------|
| **Performance Score** | 100 | 97 | -3 | Next.js |
| TTFB | 26ms | 201ms | +175ms (+673%) | Next.js |
| First Contentful Paint | 806ms | 1880ms | +1074ms (+133%) | Next.js |
| Largest Contentful Paint | 1790ms | 2043ms | +253ms (+14%) | Next.js |
| Time to Interactive | 1955ms | 2043ms | +88ms (+5%) | Next.js |
| Speed Index | 806ms | 2615ms | +1809ms (+224%) | Next.js |
| Total Blocking Time | 17ms | 2ms | -15ms (-88%) | **RORP** |
| Total Bundle Size | 602KB | 606KB | +4KB | ~Equal |

## Products Page Results

| Metric | Next.js RSC | RORP RSC | Delta | Winner |
|--------|-------------|----------|-------|--------|
| **Performance Score** | 95 | 91 | -4 | Next.js |
| TTFB | 21ms | 59ms | +38ms (+181%) | Next.js |
| First Contentful Paint | 761ms | 1823ms | +1062ms (+140%) | Next.js |
| Largest Contentful Paint | 2867ms | 3339ms | +472ms (+16%) | Next.js |
| Time to Interactive | 2867ms | 3339ms | +472ms (+16%) | Next.js |
| Speed Index | 894ms | 1823ms | +929ms (+104%) | Next.js |
| Total Blocking Time | 31ms | 0ms | -31ms (-100%) | **RORP** |

## Raw TTFB (curl, 5-request average)

| Framework | TTFB |
|-----------|------|
| Next.js RSC | 3ms |
| RORP RSC | 45ms |

Lighthouse TTFB includes Chrome startup overhead. Raw curl shows true server response time.

## Key Findings

### Next.js RSC Advantages

1. **Faster First Contentful Paint** (~2x faster)
   - RSC streaming starts immediately from same Node process
   - No inter-process communication overhead

2. **Lower TTFB** (~7-15x faster)
   - Single process handles request → render → stream
   - No Rails → Node Renderer round-trip

3. **Better Speed Index**
   - Content appears progressively faster
   - Streaming chunks arrive sooner

### React on Rails Pro RSC Advantages

1. **Near-Zero Total Blocking Time**
   - Less JavaScript hydration work
   - Main thread stays responsive during load

2. **Ruby Ecosystem Integration**
   - Full Rails stack (ActiveRecord, ActionMailer, etc.)
   - Existing Ruby codebases can adopt RSC incrementally

### Equal Performance

- **Bundle sizes similar** (~600KB)
- **Final LCP within 15%** of each other
- **Both achieve good Core Web Vitals** (90+ scores)

## Architecture Differences

### Next.js RSC

```
Browser Request
     ↓
Next.js Server (Node)
     ↓ RSC renders in same process
     ↓ Streams HTML chunks directly
Browser receives stream
```

### React on Rails Pro RSC

```
Browser Request
     ↓
Rails Server (Puma/Ruby)
     ↓ HTTP request to Node Renderer
Node Renderer (port 3800)
     ↓ RSC renders, returns stream
Rails Server
     ↓ Proxies stream to browser
Browser receives stream
```

The extra hop (Rails → Node → Rails) adds ~40-175ms latency to TTFB.

## Recommendations

### Choose Next.js RSC when:
- Greenfield project
- FCP/TTFB critical (e-commerce, media)
- Team comfortable with full JS stack

### Choose React on Rails Pro RSC when:
- Existing Rails application
- Need Ruby backend features (jobs, mailers, etc.)
- TBT more important than FCP (complex interactive pages)
- Incremental RSC adoption preferred

## Reproducing Results

```bash
# Start Next.js RSC
cd apps/complex-nextjs-rsc
npm install && npm run build && npm start

# Start RORP RSC (requires two terminals)
cd apps/ror-pro-rsc
bundle install && npm install
npm run build:production
node renderer/node-renderer.js  # Terminal 1
RAILS_ENV=production bundle exec puma -p 3000  # Terminal 2

# Run benchmarks
lighthouse http://localhost:3002/ --output=json --only-categories=performance
lighthouse http://localhost:3000/ --output=json --only-categories=performance
```

## Future Work

- [ ] Add Waku framework comparison
- [ ] Test with simulated network latency (3G, 4G)
- [ ] Add memory usage benchmarks
- [ ] Test concurrent request handling
- [ ] Compare development experience metrics
