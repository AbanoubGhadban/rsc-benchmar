#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const APPS = {
  'simple-nextjs-rsc': { port: 3001, dir: 'apps/simple-nextjs-rsc' },
  'simple-nextjs-no-rsc': { port: 3004, dir: 'apps/simple-nextjs-no-rsc' },
  'complex-nextjs-rsc': { port: 3002, dir: 'apps/complex-nextjs-rsc' },
  'complex-nextjs-no-rsc': { port: 3003, dir: 'apps/complex-nextjs-no-rsc' },
};

const PAGES_TO_TEST = {
  simple: ['/'],
  complex: ['/', '/products', '/product/product-1', '/cart', '/checkout'],
};

const RUNS_PER_PAGE = 3;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

async function runLighthouse(url, outputPath) {
  const cmd = `npx lighthouse "${url}" --output=json --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox" --only-categories=performance --preset=desktop`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    return {
      ttfb: report.audits['server-response-time']?.numericValue,
      fcp: report.audits['first-contentful-paint']?.numericValue,
      lcp: report.audits['largest-contentful-paint']?.numericValue,
      cls: report.audits['cumulative-layout-shift']?.numericValue,
      si: report.audits['speed-index']?.numericValue,
      score: report.categories.performance?.score * 100,
    };
  } catch (err) {
    console.error(`Lighthouse failed for ${url}:`, err.message);
    return null;
  }
}

function average(arr) {
  const valid = arr.filter(x => x !== null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

async function benchmarkApp(appName, app) {
  console.log(`\n========== Benchmarking: ${appName} ==========\n`);

  const resultsDir = path.join(__dirname, '..', 'results', appName);
  fs.mkdirSync(resultsDir, { recursive: true });

  const appDir = path.join(__dirname, '..', app.dir);
  const isSimple = appName.includes('simple');
  const pages = isSimple ? PAGES_TO_TEST.simple : PAGES_TO_TEST.complex;

  console.log('Building app...');
  execSync('npm run build', { cwd: appDir, stdio: 'inherit' });

  console.log('Starting server...');
  const server = spawn('npm', ['run', 'start'], {
    cwd: appDir,
    stdio: 'pipe',
    detached: true,
  });

  const baseUrl = `http://localhost:${app.port}`;
  console.log(`Waiting for server at ${baseUrl}...`);

  const ready = await waitForServer(baseUrl);
  if (!ready) {
    console.error('Server failed to start');
    process.kill(-server.pid);
    return null;
  }

  console.log('Server ready!\n');

  const results = {};

  for (const page of pages) {
    const url = `${baseUrl}${page}`;
    console.log(`Testing: ${page}`);

    const runs = [];
    for (let i = 0; i < RUNS_PER_PAGE; i++) {
      const outputPath = path.join(resultsDir, `${page.replace(/\//g, '_') || 'home'}_run${i + 1}.json`);
      const metrics = await runLighthouse(url, outputPath);
      if (metrics) {
        runs.push(metrics);
        console.log(`  Run ${i + 1}: FCP=${metrics.fcp?.toFixed(0)}ms, LCP=${metrics.lcp?.toFixed(0)}ms, Score=${metrics.score?.toFixed(0)}`);
      }
    }

    results[page] = {
      ttfb: average(runs.map(r => r?.ttfb)),
      fcp: average(runs.map(r => r?.fcp)),
      lcp: average(runs.map(r => r?.lcp)),
      cls: average(runs.map(r => r?.cls)),
      si: average(runs.map(r => r?.si)),
      score: average(runs.map(r => r?.score)),
      runs: runs.length,
    };
  }

  console.log('\nStopping server...');
  process.kill(-server.pid);

  const summaryPath = path.join(resultsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${summaryPath}`);

  return results;
}

async function main() {
  const appArg = process.argv[2];

  if (appArg && !APPS[appArg]) {
    console.error(`Unknown app: ${appArg}`);
    console.error(`Available apps: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }

  const appsToTest = appArg ? { [appArg]: APPS[appArg] } : APPS;
  const allResults = {};

  for (const [name, config] of Object.entries(appsToTest)) {
    try {
      allResults[name] = await benchmarkApp(name, config);
    } catch (err) {
      console.error(`Failed to benchmark ${name}:`, err);
    }
  }

  console.log('\n========== SUMMARY ==========\n');

  for (const [appName, results] of Object.entries(allResults)) {
    if (!results) continue;
    console.log(`${appName}:`);
    for (const [page, metrics] of Object.entries(results)) {
      console.log(`  ${page}: FCP=${metrics.fcp?.toFixed(0)}ms, LCP=${metrics.lcp?.toFixed(0)}ms, Score=${metrics.score?.toFixed(0)}`);
    }
    console.log();
  }
}

main().catch(console.error);
