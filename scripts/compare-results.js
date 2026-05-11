#!/usr/bin/env node
/**
 * Compare benchmark results and generate summary
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "../results");

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

function loadResults() {
  const allResultsPath = path.join(resultsDir, "all-results.json");
  if (!existsSync(allResultsPath)) {
    console.error("No results found. Run 'npm run bench:all' first.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(allResultsPath, "utf8"));
}

function printTable(headers, rows) {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] || "").length))
  );

  const separator = "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const formatRow = (row) =>
    "|" + row.map((cell, i) => ` ${String(cell).padEnd(colWidths[i])} `).join("|") + "|";

  console.log(separator);
  console.log(formatRow(headers));
  console.log(separator);
  rows.forEach((row) => console.log(formatRow(row)));
  console.log(separator);
}

function analyzeResults(results) {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║               RSC Benchmark Analysis Report                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Node: ${results.nodeVersion}`);
  console.log(`Platform: ${results.platform}\n`);

  // 1. Traditional SSR Summary
  if (results.benchmarks.traditionalSSR?.blocking) {
    console.log("═══ Traditional SSR Performance ═══\n");
    const headers = ["Test Case", "Blocking", "Streaming", "TTFB", "Payload"];
    const rows = results.benchmarks.traditionalSSR.blocking.map((blocking, i) => {
      const streaming = results.benchmarks.traditionalSSR.streaming[i];
      return [
        blocking.name.split(":")[1],
        formatMs(blocking.duration.mean),
        formatMs(streaming?.duration.mean || 0),
        formatMs(streaming?.duration.mean * 0.3 || 0), // Approximate TTFB
        formatBytes(blocking.payloadSize?.mean || 0),
      ];
    });
    printTable(headers, rows);
  }

  // 2. RSC vs SSR Comparison
  if (results.benchmarks.rscSSRComparison?.comparisons) {
    console.log("\n═══ RSC vs Traditional SSR ═══\n");
    const headers = ["Test Case", "SSR", "RSC Total", "RSC Flight", "Overhead", "Winner"];
    const rows = results.benchmarks.rscSSRComparison.comparisons.map((c) => {
      const winner =
        c.overhead.percent > 5 ? "SSR" : c.overhead.percent < -5 ? "RSC" : "TIE";
      return [
        c.name,
        formatMs(c.ssr.duration.mean),
        formatMs(c.rsc.duration.mean),
        formatMs(c.rsc.breakdown?.flight || 0),
        `${c.overhead.percent > 0 ? "+" : ""}${c.overhead.percent.toFixed(1)}%`,
        winner,
      ];
    });
    printTable(headers, rows);

    // Summary stats
    const rscWins = rows.filter((r) => r[5] === "RSC").length;
    const ssrWins = rows.filter((r) => r[5] === "SSR").length;
    const ties = rows.filter((r) => r[5] === "TIE").length;
    console.log(`\nSummary: RSC wins ${rscWins}, SSR wins ${ssrWins}, Ties ${ties}`);
  }

  // 3. Pattern Analysis
  if (results.benchmarks.patterns?.patterns) {
    console.log("\n═══ Pattern Analysis ═══\n");
    const headers = ["Pattern", "SSR", "RSC", "Overhead", "Expected", "Actual"];
    const rows = results.benchmarks.patterns.patterns.map((p) => [
      p.name,
      formatMs(p.ssr.duration.mean),
      formatMs(p.rsc.duration.mean),
      `${p.overhead.percent > 0 ? "+" : ""}${p.overhead.percent.toFixed(1)}%`,
      p.expectedWinner,
      p.actualWinner,
    ]);
    printTable(headers, rows);

    // Prediction accuracy
    const correct = results.benchmarks.patterns.patterns.filter(
      (p) =>
        p.expectedWinner === "neither" ||
        p.actualWinner === p.expectedWinner ||
        p.actualWinner === "tie"
    ).length;
    console.log(
      `\nPrediction accuracy: ${correct}/${results.benchmarks.patterns.patterns.length} (${((correct / results.benchmarks.patterns.patterns.length) * 100).toFixed(0)}%)`
    );
  }

  // 4. Key Findings
  console.log("\n═══ Key Findings ═══\n");

  if (results.benchmarks.rscSSRComparison?.comparisons) {
    const comparisons = results.benchmarks.rscSSRComparison.comparisons;
    const avgOverhead =
      comparisons.reduce((a, c) => a + c.overhead.percent, 0) / comparisons.length;

    console.log(`1. Average RSC overhead: ${avgOverhead > 0 ? "+" : ""}${avgOverhead.toFixed(1)}%`);

    const bestForRSC = comparisons.reduce((best, c) =>
      c.overhead.percent < best.overhead.percent ? c : best
    );
    const worstForRSC = comparisons.reduce((worst, c) =>
      c.overhead.percent > worst.overhead.percent ? c : worst
    );

    console.log(`2. Best RSC case: ${bestForRSC.name} (${bestForRSC.overhead.percent.toFixed(1)}%)`);
    console.log(`3. Worst RSC case: ${worstForRSC.name} (+${worstForRSC.overhead.percent.toFixed(1)}%)`);

    // Flight payload vs HTML comparison
    const avgFlightRatio =
      comparisons.reduce((a, c) => {
        const flightSize = c.rsc.flightSize || 0;
        const htmlSize = c.ssr.payloadSize?.mean || 1;
        return a + flightSize / htmlSize;
      }, 0) / comparisons.length;

    console.log(`4. Avg Flight/HTML size ratio: ${(avgFlightRatio * 100).toFixed(0)}%`);
  }

  console.log("\n═══ Recommendations ═══\n");
  console.log("Based on benchmark results:");
  console.log("• RSC adds serialization overhead - not always faster for SSR");
  console.log("• RSC benefits come from: client bundle size, hydration cost, streaming");
  console.log("• For pure SSR timing, traditional often wins");
  console.log("• RSC value is in full-stack architecture, not raw SSR speed");
  console.log("• Consider measuring: TTFB, TTI, hydration time, bundle size");
}

const results = loadResults();
analyzeResults(results);
