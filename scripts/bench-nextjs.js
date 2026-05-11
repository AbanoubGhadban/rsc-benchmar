#!/usr/bin/env node
/**
 * Next.js RSC vs Traditional SSR Benchmark
 */

import { spawn, execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appsDir = path.join(__dirname, '../apps');

const RSC_PORT = 3010;
const TRAD_PORT = 3011;
const DURATION = 10;
const CONNECTIONS = 10;
const RUNS = 3;

function formatMs(ms) {
  return ms < 1000 ? `${ms.toFixed(2)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function buildApp(appDir, name) {
  console.log(`Building ${name}...`);
  execSync('npm run build', {
    cwd: appDir,
    stdio: 'inherit',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });
}

function startServer(appDir, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'start', '--', '-p', String(port)], {
      cwd: appDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'production' },
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Server start timeout'));
    }, 60000);

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      if ((str.includes('Ready') || str.includes('started') || str.includes(String(port))) && !started) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(proc), 2000); // Wait for server to stabilize
      }
    });

    proc.stderr.on('data', (data) => {
      const str = data.toString();
      if (!str.includes('warn') && !str.includes('ExperimentalWarning')) {
        console.error(`  stderr: ${str.slice(0, 100)}`);
      }
    });
  });
}

async function runLoadTest(url, name) {
  // Dynamic import autocannon
  const autocannon = (await import('autocannon')).default;

  return new Promise((resolve) => {
    const instance = autocannon({
      url,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: 1,
    }, (err, result) => {
      if (err) {
        console.error(`Error testing ${name}:`, err.message);
        resolve(null);
      } else {
        resolve({
          name,
          requests: result.requests,
          latency: result.latency,
          throughput: result.throughput,
        });
      }
    });

    // Suppress autocannon output
    instance.on('done', () => {});
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Next.js RSC vs Traditional SSR Benchmark            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const rscDir = path.join(appsDir, 'next-rsc');
  const tradDir = path.join(appsDir, 'next-traditional');

  // Build both apps
  console.log('=== Building Apps ===\n');
  buildApp(rscDir, 'RSC App');
  console.log('');
  buildApp(tradDir, 'Traditional App');
  console.log('');

  // Start servers
  console.log('=== Starting Servers ===\n');
  let rscServer, tradServer;

  try {
    console.log('Starting RSC server...');
    rscServer = await startServer(rscDir, RSC_PORT);
    console.log(`✓ RSC server on port ${RSC_PORT}`);

    console.log('Starting Traditional server...');
    tradServer = await startServer(tradDir, TRAD_PORT);
    console.log(`✓ Traditional server on port ${TRAD_PORT}\n`);

    // Run benchmarks
    console.log(`=== Running Load Tests (${RUNS} runs, ${DURATION}s each) ===\n`);

    const allResults = { rsc: [], traditional: [] };

    for (let run = 1; run <= RUNS; run++) {
      console.log(`--- Run ${run}/${RUNS} ---\n`);

      // Alternate order to reduce bias
      if (run % 2 === 1) {
        console.log('Testing RSC...');
        const rscResult = await runLoadTest(`http://localhost:${RSC_PORT}`, `rsc-run-${run}`);
        if (rscResult) allResults.rsc.push(rscResult);

        console.log('Testing Traditional...');
        const tradResult = await runLoadTest(`http://localhost:${TRAD_PORT}`, `trad-run-${run}`);
        if (tradResult) allResults.traditional.push(tradResult);
      } else {
        console.log('Testing Traditional...');
        const tradResult = await runLoadTest(`http://localhost:${TRAD_PORT}`, `trad-run-${run}`);
        if (tradResult) allResults.traditional.push(tradResult);

        console.log('Testing RSC...');
        const rscResult = await runLoadTest(`http://localhost:${RSC_PORT}`, `rsc-run-${run}`);
        if (rscResult) allResults.rsc.push(rscResult);
      }

      console.log('');
    }

    // Calculate averages
    const avg = (arr, key) => arr.reduce((sum, r) => sum + r[key], 0) / arr.length;

    const rscAvg = {
      reqPerSec: avg(allResults.rsc, 'requests').average || avg(allResults.rsc.map(r => r.requests), 'average'),
      latencyP50: avg(allResults.rsc.map(r => r.latency), 'p50'),
      latencyP99: avg(allResults.rsc.map(r => r.latency), 'p99'),
    };

    // Fix averaging
    rscAvg.reqPerSec = allResults.rsc.reduce((sum, r) => sum + r.requests.average, 0) / allResults.rsc.length;
    const tradAvg = {
      reqPerSec: allResults.traditional.reduce((sum, r) => sum + r.requests.average, 0) / allResults.traditional.length,
      latencyP50: allResults.traditional.reduce((sum, r) => sum + r.latency.p50, 0) / allResults.traditional.length,
      latencyP99: allResults.traditional.reduce((sum, r) => sum + r.latency.p99, 0) / allResults.traditional.length,
    };
    rscAvg.latencyP50 = allResults.rsc.reduce((sum, r) => sum + r.latency.p50, 0) / allResults.rsc.length;
    rscAvg.latencyP99 = allResults.rsc.reduce((sum, r) => sum + r.latency.p99, 0) / allResults.rsc.length;

    // Results
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                        Results                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('| Metric       | RSC (App Router) | Traditional (Pages) | Diff    |');
    console.log('|--------------|------------------|---------------------|---------|');

    const reqDiff = ((rscAvg.reqPerSec - tradAvg.reqPerSec) / tradAvg.reqPerSec * 100).toFixed(1);
    const latDiff = ((rscAvg.latencyP50 - tradAvg.latencyP50) / tradAvg.latencyP50 * 100).toFixed(1);

    console.log(`| Req/sec      | ${rscAvg.reqPerSec.toFixed(1).padStart(16)} | ${tradAvg.reqPerSec.toFixed(1).padStart(19)} | ${(reqDiff > 0 ? '+' : '') + reqDiff}% |`);
    console.log(`| Latency p50  | ${formatMs(rscAvg.latencyP50).padStart(16)} | ${formatMs(tradAvg.latencyP50).padStart(19)} | ${(latDiff > 0 ? '+' : '') + latDiff}% |`);
    console.log(`| Latency p99  | ${formatMs(rscAvg.latencyP99).padStart(16)} | ${formatMs(tradAvg.latencyP99).padStart(19)} |         |`);

    console.log('\nRaw runs:');
    console.log('  RSC:', allResults.rsc.map(r => `${r.requests.average.toFixed(0)} req/s`).join(', '));
    console.log('  Trad:', allResults.traditional.map(r => `${r.requests.average.toFixed(0)} req/s`).join(', '));

    const winner = rscAvg.reqPerSec > tradAvg.reqPerSec ? 'RSC' : 'TRADITIONAL';
    const margin = Math.abs(parseFloat(reqDiff));

    console.log(`\n${winner} wins by ${margin.toFixed(1)}%`);

    if (winner === 'TRADITIONAL') {
      console.log('\n⚠ Traditional SSR is faster than RSC for this workload.');
      console.log('  RSC benefits are client-side (bundle size, hydration), not server speed.');
    }

    // Save results
    writeFileSync(
      path.join(__dirname, '../results/nextjs-comparison.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        config: { duration: DURATION, connections: CONNECTIONS, runs: RUNS },
        rsc: { average: rscAvg, runs: allResults.rsc },
        traditional: { average: tradAvg, runs: allResults.traditional },
        winner,
        margin,
      }, null, 2)
    );

    console.log('\n✓ Results saved to results/nextjs-comparison.json');

  } finally {
    rscServer?.kill();
    tradServer?.kill();
  }
}

main().catch(console.error);
