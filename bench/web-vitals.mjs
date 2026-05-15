// Web-vitals measurement for issue #3280 experiment.
// Adapted from rsc-benchmar/docs/perf-investigation/BENCHMARK_SCENARIOS.md.
// Runs against Rails on :3000 only.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: '/tmp/web-vitals' },
    iters: { type: 'string', default: '5' },
  },
});

mkdirSync(values.out, { recursive: true });
const iters = Number(values.iters);

const pages = [
  ['hello_world',                'http://127.0.0.1:3000/hello_world'],
  ['heavy_benchmark_traditional','http://127.0.0.1:3000/heavy_benchmark_traditional'],
  ['mega_benchmark_traditional', 'http://127.0.0.1:3000/mega_benchmark_traditional?u=500&p=1000&c=5000'],
  ['hello_server',               'http://127.0.0.1:3000/hello_server'],
  ['mega_benchmark',             'http://127.0.0.1:3000/mega_benchmark'],
];

function median(arr) {
  const s = arr.filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
  if (s.length === 0) return null;
  return s[Math.floor(s.length / 2)];
}

const browser = await chromium.launch();
const results = {};

for (const [label, url] of pages) {
  const ttfbs = [], loads = [], lcps = [];
  for (let i = 0; i < iters; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const t0 = Date.now();
    try {
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      const t_load = Date.now() - t0;
      const timing = resp ? resp.request().timing() : null;
      const ttfb = timing ? timing.responseStart : null;
      // Capture LCP if available within a short window
      const lcp = await page.evaluate(() => new Promise(r => {
        let done = false;
        new PerformanceObserver(e => { if (done) return; done = true; r(e.getEntries().pop().startTime); })
          .observe({ entryTypes: ['largest-contentful-paint'], buffered: true });
        setTimeout(() => { if (!done) { done = true; r(null); } }, 5000);
      })).catch(() => null);
      ttfbs.push(ttfb);
      loads.push(t_load);
      lcps.push(lcp);
    } catch (err) {
      ttfbs.push(null); loads.push(null); lcps.push(null);
    }
    await ctx.close();
  }
  results[label] = {
    url,
    iters,
    ttfb_p50_ms: median(ttfbs),
    load_p50_ms: median(loads),
    lcp_p50_ms: median(lcps),
    raw: { ttfbs, loads, lcps },
  };
  console.log(`${label}: ttfb=${results[label].ttfb_p50_ms} load=${results[label].load_p50_ms} lcp=${results[label].lcp_p50_ms}`);
}

await browser.close();
writeFileSync(`${values.out}/web-vitals.json`, JSON.stringify(results, null, 2));
console.log(`wrote ${values.out}/web-vitals.json`);
