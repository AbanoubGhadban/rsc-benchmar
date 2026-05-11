/**
 * RSC-only benchmark (runs with react-server condition)
 */

import { PassThrough } from "stream";
import React from "react";
import { renderToPipeableStream as renderToFlightStream } from "react-server-dom-webpack/server.node";
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

const testData = generateTestData("medium");
const webpackMap = {};

const testCases = [
  { name: "simple-static", Component: SimpleStatic, props: {} },
  { name: "with-props", Component: WithProps, props: testData.withProps },
  { name: "deep-tree", Component: DeepTree, props: { depth: 6, breadth: 3 } },
  { name: "large-list-100", Component: LargeList, props: { count: 100 } },
  { name: "large-list-1000", Component: LargeList, props: { count: 1000 } },
  { name: "data-heavy-100", Component: DataHeavy, props: { data: { ...testData.dataHeavy.data, rows: testData.dataHeavy.data.rows.slice(0, 100) } } },
  { name: "data-heavy-1000", Component: DataHeavy, props: testData.dataHeavy },
  { name: "mixed-content", Component: MixedContent, props: testData.mixedContent },
];

async function rscSerialize(Component, props) {
  const start = performance.now();

  const flightStream = new PassThrough();
  const { pipe } = renderToFlightStream(
    React.createElement(Component, props),
    webpackMap
  );
  pipe(flightStream);

  const chunks = [];
  let ttfb = null;

  await new Promise((resolve) => {
    flightStream.on("data", (chunk) => {
      if (ttfb === null) ttfb = performance.now() - start;
      chunks.push(chunk);
    });
    flightStream.on("end", resolve);
  });

  const payload = Buffer.concat(chunks);
  return {
    duration: performance.now() - start,
    ttfb,
    payloadSize: payload.length,
  };
}

async function benchmarkRSC(testCase, iterations = 50) {
  const { Component, props } = testCase;
  const metrics = new Metrics(`rsc:${testCase.name}`);

  // Warmup
  for (let i = 0; i < 5; i++) {
    await rscSerialize(Component, props);
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const result = await rscSerialize(Component, props);
    metrics.endSample(start, { payloadSize: result.payloadSize });
  }

  return metrics.getStats();
}

async function main() {
  const results = [];

  for (const testCase of testCases) {
    const stats = await benchmarkRSC(testCase);
    results.push(stats);
  }

  // Output JSON for parent process to consume
  console.log(JSON.stringify(results));
}

main().catch(console.error);
