# Next.js RSC Benchmark

## Setup

```bash
# Initialize Next.js app
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --no-src-dir

# Copy test components
cp -r ../../../shared/components/* app/components/

# Run benchmark
npm run bench
```

## Benchmark Scripts

After setup, add these to package.json:

```json
{
  "scripts": {
    "bench": "node bench.js",
    "build:benchmark": "NEXT_TELEMETRY_DISABLED=1 next build"
  }
}
```

## What This Tests

1. **App Router RSC rendering** - Full Next.js RSC pipeline
2. **Route handler latency** - API route performance  
3. **Framework overhead** - Next.js vs raw RSC

## Comparing With Raw RSC

Run raw RSC benchmark first:
```bash
cd ../../..
npm run bench:rsc-raw
```

Then compare with Next.js results to isolate framework overhead.
