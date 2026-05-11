#!/usr/bin/env node
/**
 * React on Rails Pro benchmark - RSC vs Traditional SSR
 */

import { spawn, execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appsDir = path.join(__dirname, '../apps');

const RAILS_PORT = 3000;
const RENDERER_PORT = 3800;
const DURATION = 10;
const CONNECTIONS = 10;
const RUNS = 3;

const ENDPOINTS = [
  { path: '/heavy_benchmark', name: 'RSC (async props)' },
  { path: '/heavy_benchmark_traditional', name: 'Traditional SSR' },
  { path: '/mega_benchmark', name: 'RSC Mega (async props)' },
  { path: '/mega_benchmark_traditional', name: 'Traditional Mega SSR' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

function startNodeRenderer(appDir) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['renderer/node-renderer.js'], {
      cwd: appDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        RENDERER_PORT: String(RENDERER_PORT),
        NODE_ENV: 'production',
      },
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Node renderer start timeout'));
    }, 30000);

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      if (str.includes('listening') && !started) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(proc), 1000);
      }
    });

    proc.stderr.on('data', (data) => {
      if (!started) console.error('Renderer stderr:', data.toString());
    });
  });
}

function startRailsServer(appDir) {
  return new Promise((resolve, reject) => {
    const proc = spawn('bundle', ['exec', 'puma', '-p', String(RAILS_PORT), '-e', 'production'], {
      cwd: appDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        RAILS_ENV: 'production',
        REACT_ON_RAILS_SKIP_VALIDATION: 'true',
        SECRET_KEY_BASE: 'benchmark-secret-key-base-that-is-at-least-128-bits-long-for-production',
      },
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Rails server start timeout'));
    }, 60000);

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      if ((str.includes('Listening') || str.includes('Use Ctrl-C')) && !started) {
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
  console.log('║   React on Rails Pro Benchmark: RSC vs Traditional SSR     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const railsDir = path.join(appsDir, 'ror-rsc');

  // Build assets
  console.log('=== Building Assets ===\n');
  console.log('Running shakapacker...');
  execSync('RAILS_ENV=production bin/shakapacker', {
    cwd: railsDir,
    stdio: 'inherit',
  });
  console.log('✓ Assets built\n');

  // Precompile if needed
  console.log('Precompiling assets...');
  execSync('RAILS_ENV=production SECRET_KEY_BASE=x bundle exec rails assets:precompile', {
    cwd: railsDir,
    stdio: 'pipe',
  });
  console.log('✓ Assets precompiled\n');

  console.log('=== Starting Servers ===\n');
  let renderer, rails;

  try {
    console.log('Starting Node renderer...');
    renderer = await startNodeRenderer(railsDir);
    console.log(`✓ Node renderer on port ${RENDERER_PORT}`);

    console.log('Starting Rails server...');
    rails = await startRailsServer(railsDir);
    console.log(`✓ Rails on port ${RAILS_PORT}\n`);

    // Wait for servers to be fully ready
    const ready = await waitForServer(`http://localhost:${RAILS_PORT}/heavy_benchmark`);
    if (!ready) {
      throw new Error('Rails server not responding');
    }
    console.log('✓ Servers ready\n');

    const allResults = {};

    for (const endpoint of ENDPOINTS) {
      console.log(`=== Benchmarking ${endpoint.name} (${RUNS} runs x ${DURATION}s) ===\n`);

      const results = [];
      const url = `http://localhost:${RAILS_PORT}${endpoint.path}`;

      for (let run = 1; run <= RUNS; run++) {
        console.log(`  Run ${run}/${RUNS}...`);
        const result = await runLoadTest(url, `${endpoint.name}-${run}`);
        if (result) {
          results.push(result);
          console.log(`    ${result.requests.average.toFixed(1)} req/s, p50: ${result.latency.p50}ms, p99: ${result.latency.p99}ms`);
        }
      }

      allResults[endpoint.path] = {
        name: endpoint.name,
        runs: results,
        avg: results.length ? {
          reqPerSec: results.reduce((s, r) => s + r.requests.average, 0) / results.length,
          latP50: results.reduce((s, r) => s + r.latency.p50, 0) / results.length,
          latP99: results.reduce((s, r) => s + r.latency.p99, 0) / results.length,
        } : null,
      };
      console.log('');
    }

    // Print comparison
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                React on Rails Results                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('| Endpoint                    | Req/sec | p50 (ms) | p99 (ms) |');
    console.log('|-----------------------------|---------|----------|----------|');

    for (const endpoint of ENDPOINTS) {
      const r = allResults[endpoint.path];
      if (r.avg) {
        console.log(`| ${endpoint.name.padEnd(27)} | ${r.avg.reqPerSec.toFixed(1).padStart(7)} | ${r.avg.latP50.toFixed(0).padStart(8)} | ${r.avg.latP99.toFixed(0).padStart(8)} |`);
      }
    }

    // RSC vs Traditional comparison
    const rscHeavy = allResults['/heavy_benchmark']?.avg;
    const tradHeavy = allResults['/heavy_benchmark_traditional']?.avg;

    if (rscHeavy && tradHeavy) {
      const diff = ((rscHeavy.reqPerSec - tradHeavy.reqPerSec) / tradHeavy.reqPerSec * 100).toFixed(1);
      const winner = rscHeavy.reqPerSec > tradHeavy.reqPerSec ? 'RSC' : 'Traditional';
      console.log(`\nHeavy: ${winner} wins by ${Math.abs(diff)}%`);
    }

    const rscMega = allResults['/mega_benchmark']?.avg;
    const tradMega = allResults['/mega_benchmark_traditional']?.avg;

    if (rscMega && tradMega) {
      const diff = ((rscMega.reqPerSec - tradMega.reqPerSec) / tradMega.reqPerSec * 100).toFixed(1);
      const winner = rscMega.reqPerSec > tradMega.reqPerSec ? 'RSC' : 'Traditional';
      console.log(`Mega: ${winner} wins by ${Math.abs(diff)}%`);
    }

    // Save results
    mkdirSync(path.join(__dirname, '../results'), { recursive: true });
    writeFileSync(
      path.join(__dirname, '../results/rails-comparison.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        framework: 'React on Rails Pro',
        results: allResults,
      }, null, 2)
    );

    console.log('\n✓ Results saved to results/rails-comparison.json');

  } finally {
    console.log('\nShutting down servers...');
    renderer?.kill();
    rails?.kill();
  }
}

main().catch(console.error);
