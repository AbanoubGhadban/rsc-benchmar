/**
 * Traditional SSR-only benchmark (runs without react-server condition)
 */

import React from "react";
import ReactDOMServer from "react-dom/server";
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

const { renderToString } = ReactDOMServer;

const testData = generateTestData("medium");

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

async function benchmarkSSR(testCase, iterations = 50) {
  const { Component, props } = testCase;
  const metrics = new Metrics(`ssr:${testCase.name}`);

  // Warmup
  for (let i = 0; i < 5; i++) {
    renderToString(React.createElement(Component, props));
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const html = renderToString(React.createElement(Component, props));
    metrics.endSample(start, { payloadSize: Buffer.byteLength(html, "utf8") });
  }

  return metrics.getStats();
}

async function main() {
  const results = [];

  for (const testCase of testCases) {
    const stats = await benchmarkSSR(testCase);
    results.push(stats);
  }

  // Output JSON for parent process to consume
  console.log(JSON.stringify(results));
}

main().catch(console.error);
