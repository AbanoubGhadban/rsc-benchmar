// Lighthouse CLI benchmark script for simple-nextjs-rsc app
// Run: npm run bench (after npm run build && npm run start)

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const RUNS = parseInt(process.env.BENCH_RUNS || '5', 10);
const OUTPUT_DIR = path.join(process.cwd(), 'benchmark-results');

async function runLighthouse(url, runNumber) {
  const outputPath = path.join(OUTPUT_DIR, `run-${runNumber}`);

  const cmd = `npx lighthouse ${url} \
    --output=json \
    --output=html \
    --output-path=${outputPath} \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --only-categories=performance \
    --throttling-method=provided \
    --preset=desktop`;

  console.log(`Run ${runNumber}/${RUNS}...`);
  await execAsync(cmd);

  const jsonPath = `${outputPath}.report.json`;
  const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));

  return {
    run: runNumber,
    fcp: data.audits['first-contentful-paint'].numericValue,
    lcp: data.audits['largest-contentful-paint'].numericValue,
    cls: data.audits['cumulative-layout-shift'].numericValue,
    ttfb: data.audits['server-response-time'].numericValue,
    si: data.audits['speed-index'].numericValue,
    tbt: data.audits['total-blocking-time'].numericValue,
    score: data.categories.performance.score * 100,
  };
}

function calculateStats(results, key) {
  const values = results.map(r => r[key]).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = values[Math.floor(values.length / 2)];
  const min = values[0];
  const max = values[values.length - 1];

  return { mean, median, min, max };
}

async function main() {
  console.log(`\n🚀 Benchmarking: simple-nextjs-rsc`);
  console.log(`URL: ${APP_URL}`);
  console.log(`Runs: ${RUNS}\n`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (let i = 1; i <= RUNS; i++) {
    const result = await runLighthouse(APP_URL, i);
    results.push(result);
    console.log(`  Score: ${result.score.toFixed(0)}, FCP: ${result.fcp.toFixed(0)}ms, LCP: ${result.lcp.toFixed(0)}ms, TTFB: ${result.ttfb.toFixed(0)}ms`);
  }

  console.log('\n📊 Results Summary:\n');

  const metrics = ['fcp', 'lcp', 'cls', 'ttfb', 'si', 'tbt', 'score'];
  const labels = {
    fcp: 'First Contentful Paint (ms)',
    lcp: 'Largest Contentful Paint (ms)',
    cls: 'Cumulative Layout Shift',
    ttfb: 'Time to First Byte (ms)',
    si: 'Speed Index (ms)',
    tbt: 'Total Blocking Time (ms)',
    score: 'Performance Score',
  };

  const summary = {};
  for (const metric of metrics) {
    const stats = calculateStats(results, metric);
    summary[metric] = stats;
    const isMs = !['cls', 'score'].includes(metric);
    const format = v => isMs ? `${v.toFixed(0)}ms` : v.toFixed(metric === 'cls' ? 4 : 0);
    console.log(`${labels[metric]}:`);
    console.log(`  Mean: ${format(stats.mean)}, Median: ${format(stats.median)}`);
    console.log(`  Min: ${format(stats.min)}, Max: ${format(stats.max)}\n`);
  }

  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    app: 'simple-nextjs-rsc',
    url: APP_URL,
    runs: RUNS,
    timestamp: new Date().toISOString(),
    results,
    summary,
  }, null, 2));

  console.log(`\n✅ Results saved to ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
