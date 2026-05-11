/**
 * Traditional SSR Benchmark
 * Uses ReactDOMServer.renderToString (blocking) and renderToPipeableStream (streaming)
 */

import { createServer } from "http";
import { Writable } from "stream";
import React from "react";
import { renderToString, renderToPipeableStream } from "react-dom/server";
import {
  SimpleStatic,
  WithProps,
  DeepTree,
  LargeList,
  DataHeavy,
  MixedContent,
  generateTestData,
} from "../../shared/components/TestComponents.js";
import { Metrics, formatMs, formatBytes, warmup } from "../../shared/utils/metrics.js";
import { writeFileSync } from "fs";

const testData = generateTestData("medium");
const largeTestData = generateTestData("large");

const testCases = [
  { name: "simple-static", Component: SimpleStatic, props: {} },
  { name: "with-props", Component: WithProps, props: testData.withProps },
  { name: "deep-tree", Component: DeepTree, props: testData.deepTree },
  { name: "large-list-100", Component: LargeList, props: { count: 100 } },
  { name: "large-list-1000", Component: LargeList, props: { count: 1000 } },
  { name: "data-heavy-100", Component: DataHeavy, props: { data: { ...testData.dataHeavy.data, rows: testData.dataHeavy.data.rows.slice(0, 100) } } },
  { name: "data-heavy-1000", Component: DataHeavy, props: testData.dataHeavy },
  { name: "mixed-content", Component: MixedContent, props: testData.mixedContent },
];

// Blocking SSR benchmark
async function benchRenderToString(testCase, iterations = 100) {
  const metrics = new Metrics(`traditional-ssr-blocking:${testCase.name}`);
  const { Component, props } = testCase;

  // Warmup
  for (let i = 0; i < 10; i++) {
    renderToString(React.createElement(Component, props));
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const html = renderToString(React.createElement(Component, props));
    metrics.endSample(start, { payloadSize: Buffer.byteLength(html, "utf8") });
  }

  return metrics;
}

// Streaming SSR benchmark
async function benchRenderToPipeableStream(testCase, iterations = 100) {
  const metrics = new Metrics(`traditional-ssr-streaming:${testCase.name}`);
  const { Component, props } = testCase;

  // Warmup
  for (let i = 0; i < 10; i++) {
    await streamToString(Component, props);
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const { html, ttfb, streamDuration } = await streamToString(Component, props);
    metrics.endSample(start, {
      payloadSize: Buffer.byteLength(html, "utf8"),
      ttfb,
      streamDuration,
    });
  }

  return metrics;
}

function streamToString(Component, props) {
  return new Promise((resolve, reject) => {
    let html = "";
    let ttfb = null;
    const streamStart = performance.now();

    const writable = new Writable({
      write(chunk, encoding, callback) {
        if (ttfb === null) {
          ttfb = performance.now() - streamStart;
        }
        html += chunk.toString();
        callback();
      },
    });

    const { pipe } = renderToPipeableStream(
      React.createElement(Component, props),
      {
        onShellReady() {
          pipe(writable);
        },
        onAllReady() {
          resolve({
            html,
            ttfb,
            streamDuration: performance.now() - streamStart,
          });
        },
        onError: reject,
      }
    );
  });
}

// HTTP server benchmark (for autocannon)
function createBenchServer(testCase, port = 3001) {
  const { Component, props } = testCase;

  return createServer((req, res) => {
    if (req.url === "/blocking") {
      const html = renderToString(React.createElement(Component, props));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } else if (req.url === "/streaming") {
      res.writeHead(200, { "Content-Type": "text/html" });
      const { pipe } = renderToPipeableStream(
        React.createElement(Component, props),
        {
          onShellReady() {
            pipe(res);
          },
        }
      );
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  }).listen(port);
}

async function runAllBenchmarks() {
  console.log("=== Traditional SSR Benchmark ===\n");

  const results = {
    blocking: [],
    streaming: [],
    timestamp: new Date().toISOString(),
    type: "traditional-ssr",
  };

  for (const testCase of testCases) {
    console.log(`\nBenchmarking: ${testCase.name}`);

    // Blocking
    const blockingMetrics = await benchRenderToString(testCase);
    const blockingStats = blockingMetrics.getStats();
    results.blocking.push(blockingStats);

    console.log(`  Blocking: ${formatMs(blockingStats.duration.mean)} (mean), ${formatBytes(blockingStats.payloadSize?.mean || 0)} payload`);

    // Streaming
    const streamingMetrics = await benchRenderToPipeableStream(testCase);
    const streamingStats = streamingMetrics.getStats();
    results.streaming.push(streamingStats);

    const avgTtfb = streamingMetrics.samples.reduce((a, b) => a + (b.ttfb || 0), 0) / streamingMetrics.samples.length;
    console.log(`  Streaming: ${formatMs(streamingStats.duration.mean)} (mean), TTFB: ${formatMs(avgTtfb)}, ${formatBytes(streamingStats.payloadSize?.mean || 0)} payload`);
  }

  // Save results
  writeFileSync(
    new URL("../../results/traditional-ssr.json", import.meta.url),
    JSON.stringify(results, null, 2)
  );

  console.log("\n✓ Results saved to results/traditional-ssr.json");

  return results;
}

// Run if executed directly
if (process.argv[1].endsWith("bench.js")) {
  runAllBenchmarks().catch(console.error);
}

export { runAllBenchmarks, createBenchServer, testCases };
