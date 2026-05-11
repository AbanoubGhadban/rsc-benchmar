#!/usr/bin/env node
/**
 * Load test runner using autocannon
 * Compares Traditional SSR vs RSC server performance
 */

import autocannon from "autocannon";
import { spawn } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TRADITIONAL_PORT = 3001;
const RSC_PORT = 3002;
const DURATION = 10; // seconds
const CONNECTIONS = 10;

const routes = ["/simple", "/with-props", "/deep-tree", "/large-list", "/data-heavy", "/mixed"];

function startServer(script, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [script], {
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data) => {
      if (data.toString().includes("listening")) {
        resolve(proc);
      }
    });

    proc.stderr.on("data", (data) => {
      console.error(`Server error: ${data}`);
    });

    setTimeout(() => reject(new Error("Server start timeout")), 5000);
  });
}

async function runLoadTest(url, name) {
  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url,
        duration: DURATION,
        connections: CONNECTIONS,
        pipelining: 1,
      },
      (err, result) => {
        if (err) {
          console.error(`Error testing ${name}:`, err);
          resolve(null);
        } else {
          resolve({
            name,
            url,
            latency: result.latency,
            requests: result.requests,
            throughput: result.throughput,
            errors: result.errors,
            timeouts: result.timeouts,
          });
        }
      }
    );

    autocannon.track(instance, { renderResultsTable: false });
  });
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           HTTP Load Test: Traditional SSR vs RSC           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let traditionalServer, rscServer;

  try {
    console.log("Starting servers...");

    traditionalServer = await startServer(
      path.join(__dirname, "server-traditional.js"),
      TRADITIONAL_PORT
    );
    console.log(`✓ Traditional SSR server on port ${TRADITIONAL_PORT}`);

    rscServer = await startServer(
      path.join(__dirname, "server-rsc.js"),
      RSC_PORT
    );
    console.log(`✓ RSC server on port ${RSC_PORT}`);

    console.log(`\nRunning load tests (${DURATION}s each, ${CONNECTIONS} connections)...\n`);

    const results = {
      timestamp: new Date().toISOString(),
      config: { duration: DURATION, connections: CONNECTIONS },
      tests: [],
    };

    for (const route of routes) {
      console.log(`\n--- Testing route: ${route} ---\n`);

      // Traditional SSR (blocking)
      console.log("Traditional SSR (blocking)...");
      const tradBlocking = await runLoadTest(
        `http://localhost:${TRADITIONAL_PORT}${route}`,
        `traditional-blocking:${route}`
      );
      if (tradBlocking) {
        console.log(
          `  Requests/sec: ${tradBlocking.requests.average.toFixed(1)}, Latency p99: ${tradBlocking.latency.p99}ms`
        );
        results.tests.push(tradBlocking);
      }

      // Traditional SSR (streaming)
      console.log("Traditional SSR (streaming)...");
      const tradStreaming = await runLoadTest(
        `http://localhost:${TRADITIONAL_PORT}${route}?stream=true`,
        `traditional-streaming:${route}`
      );
      if (tradStreaming) {
        console.log(
          `  Requests/sec: ${tradStreaming.requests.average.toFixed(1)}, Latency p99: ${tradStreaming.latency.p99}ms`
        );
        results.tests.push(tradStreaming);
      }

      // RSC
      console.log("RSC Flight...");
      const rsc = await runLoadTest(
        `http://localhost:${RSC_PORT}${route}`,
        `rsc:${route}`
      );
      if (rsc) {
        console.log(
          `  Requests/sec: ${rsc.requests.average.toFixed(1)}, Latency p99: ${rsc.latency.p99}ms`
        );
        results.tests.push(rsc);
      }
    }

    // Save results
    writeFileSync(
      path.join(__dirname, "../../results/load-test.json"),
      JSON.stringify(results, null, 2)
    );

    // Summary
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                        Summary                             ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const grouped = {};
    for (const test of results.tests) {
      const [type, route] = test.name.split(":");
      if (!grouped[route]) grouped[route] = {};
      grouped[route][type] = test;
    }

    console.log("| Route | Trad Blocking | Trad Streaming | RSC | Winner |");
    console.log("|-------|---------------|----------------|-----|--------|");

    for (const [route, tests] of Object.entries(grouped)) {
      const tb = tests["traditional-blocking"]?.requests?.average || 0;
      const ts = tests["traditional-streaming"]?.requests?.average || 0;
      const rsc = tests["rsc"]?.requests?.average || 0;

      const max = Math.max(tb, ts, rsc);
      const winner = max === tb ? "Blocking" : max === ts ? "Streaming" : "RSC";

      console.log(
        `| ${route.padEnd(12)} | ${tb.toFixed(0).padStart(10)} req/s | ${ts.toFixed(0).padStart(11)} req/s | ${rsc.toFixed(0).padStart(8)} req/s | ${winner} |`
      );
    }

    console.log("\n✓ Results saved to results/load-test.json");
  } finally {
    traditionalServer?.kill();
    rscServer?.kill();
  }
}

main().catch(console.error);
