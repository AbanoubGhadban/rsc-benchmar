#!/usr/bin/env node
/**
 * Generate detailed markdown report from benchmark results
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
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

function generateReport() {
  const allResultsPath = path.join(resultsDir, "all-results.json");
  if (!existsSync(allResultsPath)) {
    console.error("No results found. Run 'npm run bench:all' first.");
    process.exit(1);
  }

  const results = JSON.parse(readFileSync(allResultsPath, "utf8"));

  let report = `# RSC vs Traditional SSR Benchmark Report

**Generated:** ${results.timestamp}
**Node Version:** ${results.nodeVersion}
**Platform:** ${results.platform}

## Executive Summary

This benchmark suite measures the performance difference between React Server Components (RSC) and traditional Server-Side Rendering (SSR) across multiple dimensions.

`;

  // Traditional SSR Section
  if (results.benchmarks.traditionalSSR?.blocking) {
    report += `## Traditional SSR Performance

| Test Case | Blocking (mean) | Streaming (mean) | Payload Size |
|-----------|-----------------|------------------|--------------|
`;
    results.benchmarks.traditionalSSR.blocking.forEach((blocking, i) => {
      const streaming = results.benchmarks.traditionalSSR.streaming[i];
      report += `| ${blocking.name.split(":")[1]} | ${formatMs(blocking.duration.mean)} | ${formatMs(streaming?.duration.mean || 0)} | ${formatBytes(blocking.payloadSize?.mean || 0)} |\n`;
    });
    report += "\n";
  }

  // RSC vs SSR Comparison
  if (results.benchmarks.rscSSRComparison?.comparisons) {
    report += `## RSC vs Traditional SSR Comparison

| Test Case | Traditional SSR | RSC Pipeline | Overhead | Winner |
|-----------|-----------------|--------------|----------|--------|
`;
    results.benchmarks.rscSSRComparison.comparisons.forEach((c) => {
      const winner =
        c.overhead.percent > 5 ? "SSR" : c.overhead.percent < -5 ? "RSC" : "TIE";
      report += `| ${c.name} | ${formatMs(c.ssr.duration.mean)} | ${formatMs(c.rsc.duration.mean)} | ${c.overhead.percent > 0 ? "+" : ""}${c.overhead.percent.toFixed(1)}% | ${winner} |\n`;
    });

    // Stats
    const comparisons = results.benchmarks.rscSSRComparison.comparisons;
    const rscWins = comparisons.filter((c) => c.overhead.percent < -5).length;
    const ssrWins = comparisons.filter((c) => c.overhead.percent > 5).length;
    const ties = comparisons.filter(
      (c) => c.overhead.percent >= -5 && c.overhead.percent <= 5
    ).length;

    report += `
**Summary:** RSC wins ${rscWins}, SSR wins ${ssrWins}, Ties ${ties}

### RSC Pipeline Breakdown

| Test Case | Flight Serialization | Tree Reconstruction | Final SSR |
|-----------|---------------------|---------------------|-----------|
`;
    comparisons.forEach((c) => {
      report += `| ${c.name} | ${formatMs(c.rsc.breakdown?.flight || 0)} | ${formatMs(c.rsc.breakdown?.reconstruct || 0)} | ${formatMs(c.rsc.breakdown?.ssr || 0)} |\n`;
    });
    report += "\n";
  }

  // Pattern Analysis
  if (results.benchmarks.patterns?.patterns) {
    report += `## Pattern Analysis

Testing RSC in scenarios where it should excel vs where it shouldn't.

| Pattern | Description | SSR | RSC | Overhead | Expected | Actual |
|---------|-------------|-----|-----|----------|----------|--------|
`;
    results.benchmarks.patterns.patterns.forEach((p) => {
      report += `| ${p.name} | ${p.description} | ${formatMs(p.ssr.duration.mean)} | ${formatMs(p.rsc.duration.mean)} | ${p.overhead.percent > 0 ? "+" : ""}${p.overhead.percent.toFixed(1)}% | ${p.expectedWinner} | ${p.actualWinner} |\n`;
    });
    report += "\n";
  }

  // Conclusions
  report += `## Key Findings

1. **RSC adds serialization overhead** - The Flight protocol serialization adds time compared to direct HTML generation
2. **Streaming benefits are architectural** - RSC streaming improves TTFB but may not reduce total render time
3. **RSC value is holistic** - Benefits come from reduced client bundle size, eliminated hydration, and better data colocation
4. **Pattern matters** - RSC excels with many independent async operations, large static content, and deep component trees

## Recommendations

### When RSC Makes Sense
- Large static content areas that don't need hydration
- Pages with many independent data requirements
- Applications where client bundle size is critical
- Deep component trees with async data at multiple levels

### When Traditional SSR Might Be Better
- Highly interactive UIs needing full hydration anyway
- Simple pages with minimal data fetching
- When raw SSR speed is the only metric that matters
- Legacy codebases with no RSC infrastructure

## Methodology Notes

- All benchmarks run with ${results.benchmarks.patterns?.patterns?.[0]?.ssr?.count || 100} iterations
- Warmup runs performed before measurement
- GC triggered between benchmark phases when available
- Payload sizes measured in UTF-8 bytes

## Raw Data

Full results available in \`results/all-results.json\`
`;

  const reportPath = path.join(resultsDir, "REPORT.md");
  writeFileSync(reportPath, report);
  console.log(`Report generated: ${reportPath}`);
}

generateReport();
