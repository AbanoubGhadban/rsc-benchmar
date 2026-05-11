/**
 * Raw RSC Serialization Benchmark
 * Tests the React Flight protocol serialization overhead without any framework
 */

import { Writable } from "stream";
import React from "react";
import {
  renderToPipeableStream as renderToFlightStream,
} from "react-server-dom-webpack/server.node";
import {
  SimpleStatic,
  WithProps,
  DeepTree,
  LargeList,
  DataHeavy,
  MixedContent,
  generateTestData,
} from "../../shared/components/TestComponents.js";
import { Metrics, formatMs, formatBytes } from "../../shared/utils/metrics.js";
import { writeFileSync } from "fs";

const testData = generateTestData("medium");

// Webpack manifest mock (required by react-server-dom-webpack)
const webpackMap = {};
const webpackServerMap = {};

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

// RSC Flight stream to buffer
function flightStreamToBuffer(Component, props) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let ttfb = null;
    const streamStart = performance.now();

    const writable = new Writable({
      write(chunk, encoding, callback) {
        if (ttfb === null) {
          ttfb = performance.now() - streamStart;
        }
        chunks.push(chunk);
        callback();
      },
      final(callback) {
        const payload = Buffer.concat(chunks);
        resolve({
          payload,
          ttfb,
          streamDuration: performance.now() - streamStart,
          chunkCount: chunks.length,
        });
        callback();
      },
    });

    try {
      const { pipe } = renderToFlightStream(
        React.createElement(Component, props),
        webpackMap
      );
      pipe(writable);
    } catch (err) {
      reject(err);
    }
  });
}

async function benchRSCSerialization(testCase, iterations = 100) {
  const metrics = new Metrics(`rsc-serialization:${testCase.name}`);
  const { Component, props } = testCase;

  // Warmup
  for (let i = 0; i < 10; i++) {
    await flightStreamToBuffer(Component, props);
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const { payload, ttfb, streamDuration, chunkCount } = await flightStreamToBuffer(Component, props);
    metrics.endSample(start, {
      payloadSize: payload.length,
      ttfb,
      streamDuration,
      chunkCount,
    });
  }

  return metrics;
}

// Compare RSC payload vs JSON serialization
async function benchJSONvsFlight(testCase, iterations = 100) {
  const { Component, props } = testCase;

  // JSON serialization of props
  const jsonMetrics = new Metrics(`json-serialization:${testCase.name}`);
  for (let i = 0; i < iterations; i++) {
    const start = jsonMetrics.startSample();
    const json = JSON.stringify(props);
    jsonMetrics.endSample(start, { payloadSize: Buffer.byteLength(json, "utf8") });
  }

  // Flight serialization
  const flightMetrics = await benchRSCSerialization(testCase, iterations);

  return { json: jsonMetrics, flight: flightMetrics };
}

async function runAllBenchmarks() {
  console.log("=== Raw RSC Serialization Benchmark ===\n");

  const results = {
    rscSerialization: [],
    comparison: [],
    timestamp: new Date().toISOString(),
    type: "raw-rsc",
  };

  for (const testCase of testCases) {
    console.log(`\nBenchmarking: ${testCase.name}`);

    const metrics = await benchRSCSerialization(testCase);
    const stats = metrics.getStats();
    results.rscSerialization.push(stats);

    const avgTtfb = metrics.samples.reduce((a, b) => a + (b.ttfb || 0), 0) / metrics.samples.length;
    const avgChunks = metrics.samples.reduce((a, b) => a + (b.chunkCount || 0), 0) / metrics.samples.length;

    console.log(`  Serialization: ${formatMs(stats.duration.mean)} (mean)`);
    console.log(`  Payload: ${formatBytes(stats.payloadSize?.mean || 0)}`);
    console.log(`  TTFB: ${formatMs(avgTtfb)}`);
    console.log(`  Chunks: ${avgChunks.toFixed(1)} avg`);
  }

  // Payload analysis
  console.log("\n--- RSC Payload Analysis ---");
  for (const testCase of testCases.slice(0, 3)) {
    const { payload } = await flightStreamToBuffer(testCase.Component, testCase.props);
    const payloadStr = payload.toString("utf8");

    console.log(`\n${testCase.name}:`);
    console.log(`  Size: ${formatBytes(payload.length)}`);
    console.log(`  Preview: ${payloadStr.slice(0, 200)}...`);
  }

  // Save results
  writeFileSync(
    new URL("../../results/raw-rsc.json", import.meta.url),
    JSON.stringify(results, null, 2)
  );

  console.log("\n✓ Results saved to results/raw-rsc.json");

  return results;
}

if (process.argv[1].endsWith("bench.js")) {
  runAllBenchmarks().catch(console.error);
}

export { runAllBenchmarks, benchRSCSerialization, testCases };
