/**
 * Pattern SSR benchmark (runs without react-server condition)
 */

import React from "react";
import ReactDOMServer from "react-dom/server";
import { Metrics } from "../../shared/utils/metrics.js";

const { renderToString } = ReactDOMServer;

function simulateDataFetch(delay, data) {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

// Waterfall pattern
async function WaterfallPattern() {
  const user = await simulateDataFetch(5, { name: "John", id: 1 });
  const posts = await simulateDataFetch(5, [{ id: 1, title: "Post 1" }]);
  const comments = await simulateDataFetch(5, [{ id: 1, text: "Comment 1" }]);

  return React.createElement(
    "div",
    null,
    React.createElement("h1", null, user.name),
    React.createElement("ul", null, posts.map((p) => React.createElement("li", { key: p.id }, p.title))),
    React.createElement("ul", null, comments.map((c) => React.createElement("li", { key: c.id }, c.text)))
  );
}

// Parallel pattern
async function ParallelPattern() {
  const [user, posts, comments] = await Promise.all([
    simulateDataFetch(5, { name: "John", id: 1 }),
    simulateDataFetch(5, [{ id: 1, title: "Post 1" }]),
    simulateDataFetch(5, [{ id: 1, text: "Comment 1" }]),
  ]);

  return React.createElement(
    "div",
    null,
    React.createElement("h1", null, user.name),
    React.createElement("ul", null, posts.map((p) => React.createElement("li", { key: p.id }, p.title))),
    React.createElement("ul", null, comments.map((c) => React.createElement("li", { key: c.id }, c.text)))
  );
}

// Heavy computation
function HeavyComputation({ iterations = 10000 }) {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  return React.createElement("p", null, `Computed: ${result.toFixed(2)}`);
}

// Large static content
function LargeStaticContent({ paragraphs = 50 }) {
  const content = [];
  for (let i = 0; i < paragraphs; i++) {
    content.push(
      React.createElement(
        "p",
        { key: i },
        `Paragraph ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      )
    );
  }
  return React.createElement("article", null, ...content);
}

const patterns = [
  { name: "waterfall-fetch", async: true, fn: WaterfallPattern },
  { name: "parallel-fetch", async: true, fn: ParallelPattern },
  { name: "compute-light", async: false, fn: () => React.createElement(HeavyComputation, { iterations: 1000 }) },
  { name: "compute-heavy", async: false, fn: () => React.createElement(HeavyComputation, { iterations: 50000 }) },
  { name: "static-small", async: false, fn: () => React.createElement(LargeStaticContent, { paragraphs: 10 }) },
  { name: "static-large", async: false, fn: () => React.createElement(LargeStaticContent, { paragraphs: 100 }) },
];

async function benchPattern(pattern, iterations = 30) {
  const metrics = new Metrics(`ssr:${pattern.name}`);

  // Warmup
  for (let i = 0; i < 3; i++) {
    const el = pattern.async ? await pattern.fn() : pattern.fn();
    renderToString(el);
  }
  global.gc?.();

  for (let i = 0; i < iterations; i++) {
    const start = metrics.startSample();
    const el = pattern.async ? await pattern.fn() : pattern.fn();
    const html = renderToString(el);
    metrics.endSample(start, { payloadSize: Buffer.byteLength(html, "utf8") });
  }

  return metrics.getStats();
}

async function main() {
  const results = [];
  for (const pattern of patterns) {
    const stats = await benchPattern(pattern);
    results.push(stats);
  }
  console.log(JSON.stringify(results));
}

main().catch(console.error);
