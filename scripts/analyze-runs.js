#!/usr/bin/env node
/**
 * Analyze multi-run benchmark data
 */

// Canary runs (extracted from output)
const canary = {
  "simple-static": [164.3, 255.8, 159.6, 158.4, 192.7],
  "with-props": [184.1, 165.4, 105.1, 103.1, 189.2],
  "deep-tree": [637.0, 554.0, 525.4, 549.9, 812.6],
  "large-list-100": [526.6, 155.5, 134.1, 183.6, 1932.8],
  "large-list-1000": [61.9, 436.9, 360.1, 1095.4, 299.1],
};

// Stable runs (extracted from output)
const stable = {
  "simple-static": [1069.5, 160.5, 183.3, 148.3, 153.3],
  "with-props": [196.6, 129.3, 116.1, 90.4, 92.0],
  "deep-tree": [605.9, 523.7, 476.6, 542.5, 448.4],
  "large-list-100": [654.5, 114.8, 132.4, 146.4, 131.2],
  "large-list-1000": [311.1, 350.6, 313.4, 132.9, 317.7],
};

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100; // Coefficient of variation

  // Trimmed mean (remove min and max)
  const trimmed = sorted.slice(1, -1);
  const trimmedMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return { mean, median, min, max, stdDev, cv, trimmedMean };
}

console.log("╔═══════════════════════════════════════════════════════════════════════╗");
console.log("║              RSC Overhead Analysis (% slower than SSR)                ║");
console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

console.log("Raw data (5 runs each):\n");

for (const test of Object.keys(canary)) {
  console.log(`${test}:`);
  console.log(`  Canary: ${canary[test].map(x => x.toFixed(0) + "%").join(", ")}`);
  console.log(`  Stable: ${stable[test].map(x => x.toFixed(0) + "%").join(", ")}`);
}

console.log("\n═══════════════════════════════════════════════════════════════════════\n");
console.log("Statistical Analysis:\n");

console.log("| Test            | Version | Mean   | Median | Trimmed | StdDev | CV%   |");
console.log("|-----------------|---------|--------|--------|---------|--------|-------|");

for (const test of Object.keys(canary)) {
  const cs = stats(canary[test]);
  const ss = stats(stable[test]);

  console.log(`| ${test.padEnd(15)} | Canary  | ${cs.mean.toFixed(0).padStart(5)}% | ${cs.median.toFixed(0).padStart(5)}% | ${cs.trimmedMean.toFixed(0).padStart(6)}% | ${cs.stdDev.toFixed(0).padStart(5)} | ${cs.cv.toFixed(0).padStart(4)}% |`);
  console.log(`| ${" ".repeat(15)} | Stable  | ${ss.mean.toFixed(0).padStart(5)}% | ${ss.median.toFixed(0).padStart(5)}% | ${ss.trimmedMean.toFixed(0).padStart(6)}% | ${ss.stdDev.toFixed(0).padStart(5)} | ${ss.cv.toFixed(0).padStart(4)}% |`);
}

console.log("\n═══════════════════════════════════════════════════════════════════════\n");
console.log("Noise Analysis (Coefficient of Variation):\n");

let highNoise = 0;
for (const test of Object.keys(canary)) {
  const cs = stats(canary[test]);
  const ss = stats(stable[test]);
  const avgCV = (cs.cv + ss.cv) / 2;
  const noise = avgCV > 50 ? "🔴 HIGH" : avgCV > 25 ? "🟡 MODERATE" : "🟢 LOW";
  console.log(`  ${test}: ${noise} (CV: ${avgCV.toFixed(0)}%)`);
  if (avgCV > 50) highNoise++;
}

console.log("\n═══════════════════════════════════════════════════════════════════════\n");
console.log("Comparison (using trimmed mean to reduce outlier impact):\n");

console.log("| Test            | Canary | Stable | Diff   | Winner  |");
console.log("|-----------------|--------|--------|--------|---------|");

let canaryWins = 0, stableWins = 0;

for (const test of Object.keys(canary)) {
  const cs = stats(canary[test]);
  const ss = stats(stable[test]);
  const diff = cs.trimmedMean - ss.trimmedMean;
  const winner = Math.abs(diff) < 20 ? "TIE" : diff < 0 ? "CANARY" : "STABLE";

  if (winner === "CANARY") canaryWins++;
  if (winner === "STABLE") stableWins++;

  console.log(`| ${test.padEnd(15)} | ${cs.trimmedMean.toFixed(0).padStart(5)}% | ${ss.trimmedMean.toFixed(0).padStart(5)}% | ${(diff > 0 ? "+" : "") + diff.toFixed(0).padStart(5)}% | ${winner.padEnd(7)} |`);
}

console.log("\n═══════════════════════════════════════════════════════════════════════\n");
console.log("VERDICT:\n");
console.log(`  Canary wins: ${canaryWins}`);
console.log(`  Stable wins: ${stableWins}`);
console.log(`  High noise tests: ${highNoise}/${Object.keys(canary).length}`);
console.log("\n  ⚠ High variance makes comparison unreliable.");
console.log("  Consider: more iterations, warmup runs, isolated environment.");
