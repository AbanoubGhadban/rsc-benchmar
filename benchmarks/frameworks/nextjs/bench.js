#!/usr/bin/env node
/**
 * Next.js RSC Benchmark
 * Run after: npx create-next-app@latest . --typescript --app
 */

import { spawn, execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import autocannon from "autocannon";

const PORT = 3003;
const DURATION = 10;
const CONNECTIONS = 10;

const routes = [
  "/",
  "/simple",
  "/with-props",
  "/deep-tree",
  "/large-list",
  "/data-heavy",
];

async function buildApp() {
  console.log("Building Next.js app...");
  execSync("npm run build", {
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      if (str.includes("Ready") || str.includes("started")) {
        setTimeout(() => resolve(proc), 1000);
      }
    });

    proc.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    setTimeout(() => reject(new Error("Server start timeout")), 30000);
  });
}

async function runLoadTest(url, name) {
  return new Promise((resolve) => {
    autocannon(
      {
        url,
        duration: DURATION,
        connections: CONNECTIONS,
      },
      (err, result) => {
        if (err) {
          console.error(`Error: ${err}`);
          resolve(null);
        } else {
          resolve({
            name,
            latency: result.latency,
            requests: result.requests,
            throughput: result.throughput,
          });
        }
      }
    );
  });
}

async function main() {
  if (!existsSync("package.json")) {
    console.error("Run this from the Next.js app directory");
    console.error("Setup: npx create-next-app@latest . --typescript --app");
    process.exit(1);
  }

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              Next.js RSC Benchmark                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let server;

  try {
    await buildApp();

    console.log("\nStarting production server...");
    server = await startServer();
    console.log(`✓ Server running on port ${PORT}\n`);

    const results = {
      timestamp: new Date().toISOString(),
      framework: "nextjs",
      tests: [],
    };

    for (const route of routes) {
      console.log(`Testing ${route}...`);
      const result = await runLoadTest(`http://localhost:${PORT}${route}`, route);
      if (result) {
        results.tests.push(result);
        console.log(`  ${result.requests.average.toFixed(0)} req/s, p99: ${result.latency.p99}ms`);
      }
    }

    writeFileSync("bench-results.json", JSON.stringify(results, null, 2));
    console.log("\n✓ Results saved to bench-results.json");
  } finally {
    server?.kill();
  }
}

main().catch(console.error);
