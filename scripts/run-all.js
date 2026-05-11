#!/usr/bin/env node
/**
 * Run all benchmarks and generate comparison report
 */

import { spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "../results");

if (!existsSync(resultsDir)) {
  mkdirSync(resultsDir, { recursive: true });
}

function runScript(script, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`  Running: node ${args.join(" ")} ${script}`);
    const proc = spawn("node", [...args, script], {
      cwd: path.dirname(script),
      stdio: "inherit",
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║           RSC vs Traditional SSR Benchmark Suite           ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

async function runBenchmarks() {
  const benchmarks = [
    {
      name: "Traditional SSR",
      script: path.join(__dirname, "../benchmarks/traditional-ssr/bench.js"),
      args: [],
    },
    {
      name: "Raw RSC Serialization",
      script: path.join(__dirname, "../benchmarks/raw-rsc/bench.js"),
      args: ["--conditions=react-server"],
    },
    {
      name: "RSC vs SSR Comparison",
      script: path.join(__dirname, "../benchmarks/rsc-ssr/bench.js"),
      args: [],
    },
    {
      name: "Pattern Benchmarks",
      script: path.join(__dirname, "../benchmarks/patterns/bench.js"),
      args: [],
    },
  ];

  for (let i = 0; i < benchmarks.length; i++) {
    const bench = benchmarks[i];
    console.log(`\n[${i + 1}/${benchmarks.length}] ${bench.name}\n`);

    try {
      await runScript(bench.script, bench.args);
      console.log(`\n✓ ${bench.name} complete`);
    } catch (err) {
      console.error(`\n✗ ${bench.name} failed: ${err.message}`);
    }
  }

  // Combine all results
  console.log("\n\nCombining results...");

  const allResults = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    benchmarks: {},
  };

  const resultFiles = [
    ["traditionalSSR", "traditional-ssr.json"],
    ["rawRSC", "raw-rsc.json"],
    ["rscSSRComparison", "rsc-ssr-comparison.json"],
    ["patterns", "patterns.json"],
  ];

  for (const [key, file] of resultFiles) {
    const filepath = path.join(resultsDir, file);
    if (existsSync(filepath)) {
      try {
        allResults.benchmarks[key] = JSON.parse(readFileSync(filepath, "utf8"));
      } catch (e) {
        console.error(`  Warning: Could not read ${file}`);
      }
    }
  }

  writeFileSync(
    path.join(resultsDir, "all-results.json"),
    JSON.stringify(allResults, null, 2)
  );

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    Benchmark Complete                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\nResults saved to results/");
  console.log("  • all-results.json (combined)");
  console.log("  • traditional-ssr.json");
  console.log("  • raw-rsc.json");
  console.log("  • rsc-ssr-comparison.json");
  console.log("  • patterns.json");
  console.log("\nRun 'npm run bench:compare' for analysis");
  console.log("Run 'npm run report' to generate markdown report");
}

runBenchmarks().catch((err) => {
  console.error("Benchmark suite failed:", err);
  process.exit(1);
});
