#!/usr/bin/env node
/**
 * RSC vs SSR Comparison Benchmark
 * Runs SSR and RSC in separate processes (they require different Node conditions)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function runBenchmark(script, conditions = []) {
  return new Promise((resolve, reject) => {
    const args = conditions.length ? [`--conditions=${conditions.join(",")}`, script] : [script];
    const proc = spawn("node", args, {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Failed to parse output: ${stdout}`));
        }
      }
    });
  });
}

async function main() {
  console.log("=== RSC vs Traditional SSR Comparison ===\n");
  console.log("Running benchmarks in separate processes...\n");

  // Run SSR benchmark (no special conditions)
  console.log("Running Traditional SSR benchmark...");
  const ssrResults = await runBenchmark("bench-ssr.js");
  console.log("✓ SSR complete\n");

  // Run RSC benchmark (with react-server condition)
  console.log("Running RSC benchmark...");
  const rscResults = await runBenchmark("bench-rsc.js", ["react-server"]);
  console.log("✓ RSC complete\n");

  // Combine and analyze results
  console.log("=== Results ===\n");

  const comparisons = [];

  for (let i = 0; i < ssrResults.length; i++) {
    const ssr = ssrResults[i];
    const rsc = rscResults[i];

    const testName = ssr.name.split(":")[1];
    const overhead = ((rsc.duration.mean - ssr.duration.mean) / ssr.duration.mean) * 100;
    const payloadRatio = (rsc.payloadSize?.mean || 0) / (ssr.payloadSize?.mean || 1);

    const comparison = {
      name: testName,
      ssr: {
        duration: ssr.duration.mean,
        payload: ssr.payloadSize?.mean,
      },
      rsc: {
        duration: rsc.duration.mean,
        payload: rsc.payloadSize?.mean,
      },
      overhead,
      payloadRatio,
    };
    comparisons.push(comparison);

    console.log(`--- ${testName} ---`);
    console.log(`  SSR:     ${formatMs(ssr.duration.mean)} → ${formatBytes(ssr.payloadSize?.mean || 0)} HTML`);
    console.log(`  RSC:     ${formatMs(rsc.duration.mean)} → ${formatBytes(rsc.payloadSize?.mean || 0)} Flight`);
    console.log(`  Overhead: ${overhead > 0 ? "+" : ""}${overhead.toFixed(1)}%`);
    console.log(`  Payload:  ${payloadRatio.toFixed(2)}x (Flight/HTML)\n`);
  }

  // Summary
  const avgOverhead = comparisons.reduce((a, c) => a + c.overhead, 0) / comparisons.length;
  const avgPayloadRatio = comparisons.reduce((a, c) => a + c.payloadRatio, 0) / comparisons.length;

  console.log("=== Summary ===");
  console.log(`Average RSC overhead: ${avgOverhead > 0 ? "+" : ""}${avgOverhead.toFixed(1)}%`);
  console.log(`Average Flight/HTML ratio: ${avgPayloadRatio.toFixed(2)}x`);

  if (avgOverhead > 0) {
    console.log("\n⚠ RSC serialization is SLOWER than direct SSR");
    console.log("  This is expected - RSC value is in other areas:");
    console.log("  • Smaller client bundles (no server component code shipped)");
    console.log("  • No hydration for server components");
    console.log("  • Better streaming/suspense integration");
  } else {
    console.log("\n✓ RSC serialization is FASTER than SSR for these cases");
  }

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    comparisons,
    summary: {
      avgOverhead,
      avgPayloadRatio,
    },
  };

  writeFileSync(
    path.join(__dirname, "../../results/rsc-ssr-comparison.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n✓ Results saved to results/rsc-ssr-comparison.json");
}

main().catch(console.error);
