#!/usr/bin/env node
/**
 * Pattern Benchmarks - RSC vs SSR for different use cases
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

const patternMeta = {
  "waterfall-fetch": { description: "Sequential data fetches", expectedWinner: "tie" },
  "parallel-fetch": { description: "Parallel data fetches (RSC sweet spot)", expectedWinner: "rsc" },
  "compute-light": { description: "Light server computation", expectedWinner: "tie" },
  "compute-heavy": { description: "Heavy computation (RSC: no client JS)", expectedWinner: "rsc" },
  "static-small": { description: "Small static content", expectedWinner: "tie" },
  "static-large": { description: "Large static (RSC: no hydration)", expectedWinner: "rsc" },
};

function runBenchmark(script, conditions = []) {
  return new Promise((resolve, reject) => {
    const args = conditions.length ? [`--conditions=${conditions.join(",")}`, script] : [script];
    const proc = spawn("node", args, {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Exit ${code}: ${stderr}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Parse error: ${stdout}`));
        }
      }
    });
  });
}

async function main() {
  console.log("=== Pattern Benchmarks ===\n");
  console.log("Testing RSC performance in different scenarios\n");

  console.log("Running SSR benchmarks...");
  const ssrResults = await runBenchmark("bench-ssr.js");
  console.log("✓ SSR complete\n");

  console.log("Running RSC benchmarks...");
  const rscResults = await runBenchmark("bench-rsc.js", ["react-server"]);
  console.log("✓ RSC complete\n");

  console.log("=== Results ===\n");

  const comparisons = [];

  for (let i = 0; i < ssrResults.length; i++) {
    const ssr = ssrResults[i];
    const rsc = rscResults[i];
    const name = ssr.name.split(":")[1];
    const meta = patternMeta[name] || {};

    const overhead = ((rsc.duration.mean - ssr.duration.mean) / ssr.duration.mean) * 100;
    const actualWinner = overhead > 10 ? "ssr" : overhead < -10 ? "rsc" : "tie";

    const comparison = {
      name,
      description: meta.description,
      expectedWinner: meta.expectedWinner,
      actualWinner,
      ssr: { duration: ssr.duration.mean, payload: ssr.payloadSize?.mean },
      rsc: { duration: rsc.duration.mean, payload: rsc.payloadSize?.mean },
      overhead,
    };
    comparisons.push(comparison);

    const match = actualWinner === meta.expectedWinner ? "✓" : "✗";
    console.log(`--- ${name} ---`);
    console.log(`  ${meta.description}`);
    console.log(`  SSR: ${formatMs(ssr.duration.mean)} | RSC: ${formatMs(rsc.duration.mean)}`);
    console.log(`  Overhead: ${overhead > 0 ? "+" : ""}${overhead.toFixed(1)}%`);
    console.log(`  Expected: ${meta.expectedWinner} | Actual: ${actualWinner} ${match}\n`);
  }

  // Summary
  console.log("=== Summary ===\n");

  const correct = comparisons.filter((c) => c.actualWinner === c.expectedWinner).length;
  console.log(`Prediction accuracy: ${correct}/${comparisons.length}`);

  const rscWins = comparisons.filter((c) => c.actualWinner === "rsc").length;
  const ssrWins = comparisons.filter((c) => c.actualWinner === "ssr").length;
  const ties = comparisons.filter((c) => c.actualWinner === "tie").length;

  console.log(`RSC wins: ${rscWins} | SSR wins: ${ssrWins} | Ties: ${ties}`);

  console.log("\n=== Key Insights ===\n");
  console.log("1. RSC serialization adds overhead for simple cases");
  console.log("2. For server-only work (compute, data), overhead is acceptable");
  console.log("3. RSC value is CLIENT-SIDE: smaller bundles, no hydration");
  console.log("4. Benchmark measures SERVER time only - not full picture");

  // Save results
  writeFileSync(
    path.join(__dirname, "../../results/patterns.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), comparisons }, null, 2)
  );

  console.log("\n✓ Results saved to results/patterns.json");
}

main().catch(console.error);
