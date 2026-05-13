// Cross-page autocannon harness for the experiment issues at
// https://github.com/shakacode/react_on_rails (issues #3280–#3285).
//
// Runs autocannon over the small/medium/large traditional-SSR pages of this
// repo plus the same pages on Next.js if it's running. Records median/p95/p99
// latency, req/s, errors. Writes one JSON file per run.
//
// Usage:
//   # Rails on :3000, Next.js on :3001 (optional)
//   node bench/cross-page-autocannon.mjs --concurrency=10 --duration=30 --out=/tmp/exp-1
//   # Or with concurrency sweep:
//   node bench/cross-page-autocannon.mjs --sweep --duration=20 --out=/tmp/exp-1
//
// Compare before/after by running once before applying an experiment, once
// after, and diff'ing the JSON outputs.

import autocannon from 'autocannon';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    concurrency: { type: 'string', default: '10' },
    duration:    { type: 'string', default: '20' },
    sweep:       { type: 'boolean', default: false },
    out:         { type: 'string', default: '/tmp/cross-page-autocannon' },
    'rails-port':{ type: 'string', default: '3000' },
    'next-port': { type: 'string', default: '3001' },
  },
});

mkdirSync(values.out, { recursive: true });

const RAILS = `http://127.0.0.1:${values['rails-port']}`;
const NEXT  = `http://127.0.0.1:${values['next-port']}`;

const pages = [
  // [label,                        URL,                                              expected payload]
  ['rails-hello-world',             `${RAILS}/hello_world`,                           'tiny'],
  ['rails-heavy-traditional',       `${RAILS}/heavy_benchmark_traditional`,           'medium'],
  ['rails-mega-traditional',        `${RAILS}/mega_benchmark_traditional`,            'large'],
  ['rails-mega-traditional-empty',  `${RAILS}/mega_benchmark_traditional?u=0&p=0&c=0`,'tiny'],
  // RSC variants (streaming)
  ['rails-hello-server',            `${RAILS}/hello_server`,                          'tiny'],
  ['rails-heavy-rsc',               `${RAILS}/heavy_benchmark`,                       'medium'],
  ['rails-mega-rsc',                `${RAILS}/mega_benchmark`,                        'large'],
  // Next.js counterparts (skip silently if not running)
  ['next-heavy',                    `${NEXT}/heavy`,                                  'medium'],
  ['next-mega',                     `${NEXT}/mega`,                                   'large'],
];

const concurrencies = values.sweep ? [1, 10, 50] : [Number(values.concurrency)];
const duration = Number(values.duration);

async function isAlive(url) {
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 2000);
    const r = await fetch(url, { signal: ac.signal });
    return r.status < 500;
  } catch {
    return false;
  }
}

function runOne(url, { connections, duration }) {
  return new Promise((resolve, reject) => {
    const inst = autocannon({ url, connections, duration, pipelining: 1 }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    inst.on('done', () => {});
  });
}

const results = [];
for (const [label, url, expected] of pages) {
  const alive = await isAlive(url);
  if (!alive) {
    console.log(`  SKIP ${label}: ${url} not responding`);
    continue;
  }
  console.log(`\n== ${label} (${url}) — payload: ${expected} ==`);
  for (const c of concurrencies) {
    console.log(`  c=${c} d=${duration}s ...`);
    // Warmup
    await runOne(url, { connections: c, duration: 3 });
    // Measure
    const r = await runOne(url, { connections: c, duration });
    const row = {
      label, url, expected, connections: c, duration,
      req_per_s: r.requests.average,
      latency_p50_ms: r.latency.p50,
      latency_p95_ms: r.latency.p95,
      latency_p99_ms: r.latency.p99,
      latency_max_ms: r.latency.max,
      bytes_per_s:    r.throughput.average,
      errors:         r.errors,
      non2xx:         r.non2xx,
      timeouts:       r.timeouts,
    };
    results.push(row);
    console.log(`    req/s=${row.req_per_s.toFixed(0)}  p50=${row.latency_p50_ms}ms  p95=${row.latency_p95_ms}ms  p99=${row.latency_p99_ms}ms  errs=${row.errors}`);
  }
}

const outPath = `${values.out}/cross-page-${Date.now()}.json`;
writeFileSync(outPath, JSON.stringify({ when: new Date().toISOString(), values, results }, null, 2));
console.log(`\nWrote ${outPath}`);

// Compact table
console.log('\n=== Summary ===');
console.log('label                          | conn | req/s   | p50    | p95    | p99    | errs');
console.log('-------------------------------|------|---------|--------|--------|--------|-----');
for (const r of results) {
  console.log(`${r.label.padEnd(30)} | ${String(r.connections).padStart(4)} | ${String(Math.round(r.req_per_s)).padStart(7)} | ${String(r.latency_p50_ms).padStart(6)} | ${String(r.latency_p95_ms).padStart(6)} | ${String(r.latency_p99_ms).padStart(6)} | ${r.errors}`);
}
