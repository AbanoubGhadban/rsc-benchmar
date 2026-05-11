#!/usr/bin/env node
/**
 * Heavy DB query benchmark - RSC vs Traditional
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
        setTimeout(() => resolve(proc), 2000);
      }
    });

    proc.stderr.on('data', () => {});
  });
}

async function runLoadTest(url, name) {
  const autocannon = (await import('autocannon')).default;

  return new Promise((resolve) => {
    autocannon({
      url,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: 1,
    }, (err, result) => {
      if (err) {
        console.error(`Error: ${err.message}`);
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
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Heavy DB Queries Benchmark: RSC vs Traditional         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const rscDir = path.join(appsDir, 'next-rsc');
  const tradDir = path.join(appsDir, 'next-traditional');

  console.log('=== Building Apps ===\n');
  buildApp(rscDir, 'RSC App');
  console.log('');
  buildApp(tradDir, 'Traditional App');
  console.log('');

  console.log('=== Starting Servers ===\n');
  let rscServer, tradServer;

  try {
    console.log('Starting RSC server...');
    rscServer = await startServer(rscDir, RSC_PORT);
    console.log(`✓ RSC on port ${RSC_PORT}`);

    console.log('Starting Traditional server...');
    tradServer = await startServer(tradDir, TRAD_PORT);
    console.log(`✓ Traditional on port ${TRAD_PORT}\n`);

    console.log(`=== Benchmarking /heavy (${RUNS} runs x ${DURATION}s) ===\n`);

    const allResults = { rsc: [], traditional: [] };

    for (let run = 1; run <= RUNS; run++) {
      console.log(`--- Run ${run}/${RUNS} ---`);

      if (run % 2 === 1) {
        const rsc = await runLoadTest(`http://localhost:${RSC_PORT}/heavy`, `rsc-${run}`);
        if (rsc) allResults.rsc.push(rsc);
        console.log(`  RSC: ${rsc?.requests.average.toFixed(1)} req/s, p50: ${rsc?.latency.p50}ms`);

        const trad = await runLoadTest(`http://localhost:${TRAD_PORT}/heavy`, `trad-${run}`);
        if (trad) allResults.traditional.push(trad);
        console.log(`  Traditional: ${trad?.requests.average.toFixed(1)} req/s, p50: ${trad?.latency.p50}ms`);
      } else {
        const trad = await runLoadTest(`http://localhost:${TRAD_PORT}/heavy`, `trad-${run}`);
        if (trad) allResults.traditional.push(trad);
        console.log(`  Traditional: ${trad?.requests.average.toFixed(1)} req/s, p50: ${trad?.latency.p50}ms`);

        const rsc = await runLoadTest(`http://localhost:${RSC_PORT}/heavy`, `rsc-${run}`);
        if (rsc) allResults.rsc.push(rsc);
        console.log(`  RSC: ${rsc?.requests.average.toFixed(1)} req/s, p50: ${rsc?.latency.p50}ms`);
      }
      console.log('');
    }

    // Calculate averages
    const rscAvg = {
      reqPerSec: allResults.rsc.reduce((s, r) => s + r.requests.average, 0) / allResults.rsc.length,
      latP50: allResults.rsc.reduce((s, r) => s + r.latency.p50, 0) / allResults.rsc.length,
      latP99: allResults.rsc.reduce((s, r) => s + r.latency.p99, 0) / allResults.rsc.length,
    };
    const tradAvg = {
      reqPerSec: allResults.traditional.reduce((s, r) => s + r.requests.average, 0) / allResults.traditional.length,
      latP50: allResults.traditional.reduce((s, r) => s + r.latency.p50, 0) / allResults.traditional.length,
      latP99: allResults.traditional.reduce((s, r) => s + r.latency.p99, 0) / allResults.traditional.length,
    };

    const diff = ((rscAvg.reqPerSec - tradAvg.reqPerSec) / tradAvg.reqPerSec * 100).toFixed(1);
    const winner = rscAvg.reqPerSec > tradAvg.reqPerSec ? 'RSC' : 'TRADITIONAL';

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 Heavy Query Results                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('| Metric      | RSC (App Router) | Traditional (Pages) | Diff    |');
    console.log('|-------------|------------------|---------------------|---------|');
    console.log(`| Req/sec     | ${rscAvg.reqPerSec.toFixed(1).padStart(16)} | ${tradAvg.reqPerSec.toFixed(1).padStart(19)} | ${(diff > 0 ? '+' : '') + diff}% |`);
    console.log(`| Latency p50 | ${(rscAvg.latP50 + 'ms').padStart(16)} | ${(tradAvg.latP50 + 'ms').padStart(19)} |         |`);
    console.log(`| Latency p99 | ${(rscAvg.latP99 + 'ms').padStart(16)} | ${(tradAvg.latP99 + 'ms').padStart(19)} |         |`);

    console.log(`\n${winner} wins by ${Math.abs(diff)}%`);

    console.log('\nRaw runs:');
    console.log('  RSC:', allResults.rsc.map(r => `${r.requests.average.toFixed(0)}`).join(', '), 'req/s');
    console.log('  Trad:', allResults.traditional.map(r => `${r.requests.average.toFixed(0)}`).join(', '), 'req/s');

    writeFileSync(
      path.join(__dirname, '../results/heavy-comparison.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/heavy',
        queries: 6,
        rsc: { avg: rscAvg, runs: allResults.rsc },
        traditional: { avg: tradAvg, runs: allResults.traditional },
        winner,
        diff: parseFloat(diff),
      }, null, 2)
    );

    console.log('\n✓ Results saved to results/heavy-comparison.json');

  } finally {
    rscServer?.kill();
    tradServer?.kill();
  }
}

main().catch(console.error);
