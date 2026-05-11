/**
 * Test components for benchmarking various patterns
 * These are shared across traditional SSR and RSC benchmarks
 */

import React from "react";

// Simple static component
export function SimpleStatic() {
  return React.createElement(
    "div",
    { className: "simple" },
    React.createElement("h1", null, "Hello World"),
    React.createElement("p", null, "This is a simple static component")
  );
}

// Component with props
export function WithProps({ title, items }) {
  return React.createElement(
    "div",
    { className: "with-props" },
    React.createElement("h1", null, title),
    React.createElement(
      "ul",
      null,
      items.map((item, i) =>
        React.createElement("li", { key: i }, item)
      )
    )
  );
}

// Deeply nested component tree
export function DeepTree({ depth = 10, breadth = 3 }) {
  if (depth === 0) {
    return React.createElement("span", null, "Leaf");
  }

  const children = [];
  for (let i = 0; i < breadth; i++) {
    children.push(
      React.createElement(DeepTree, {
        key: i,
        depth: depth - 1,
        breadth,
      })
    );
  }

  return React.createElement(
    "div",
    { className: `depth-${depth}` },
    children
  );
}

// Large list component
export function LargeList({ count = 1000 }) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(
      React.createElement(
        "li",
        { key: i, className: "list-item" },
        React.createElement("span", { className: "index" }, i),
        React.createElement("span", { className: "content" }, `Item ${i} with some content`)
      )
    );
  }
  return React.createElement("ul", { className: "large-list" }, items);
}

// Data-heavy component (simulates fetched data)
export function DataHeavy({ data }) {
  return React.createElement(
    "div",
    { className: "data-heavy" },
    React.createElement("h1", null, data.title),
    React.createElement("p", null, data.description),
    React.createElement(
      "table",
      null,
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          Object.keys(data.rows[0] || {}).map((key) =>
            React.createElement("th", { key }, key)
          )
        )
      ),
      React.createElement(
        "tbody",
        null,
        data.rows.map((row, i) =>
          React.createElement(
            "tr",
            { key: i },
            Object.values(row).map((val, j) =>
              React.createElement("td", { key: j }, String(val))
            )
          )
        )
      )
    )
  );
}

// Mixed content component
export function MixedContent({ sections }) {
  return React.createElement(
    "article",
    { className: "mixed-content" },
    sections.map((section, i) =>
      React.createElement(
        "section",
        { key: i },
        React.createElement("h2", null, section.title),
        React.createElement("p", null, section.text),
        section.items &&
          React.createElement(
            "ul",
            null,
            section.items.map((item, j) =>
              React.createElement("li", { key: j }, item)
            )
          )
      )
    )
  );
}

// Generate test data
export function generateTestData(size = "medium") {
  const sizes = {
    small: { rows: 10, sections: 3, items: 5 },
    medium: { rows: 100, sections: 10, items: 20 },
    large: { rows: 1000, sections: 50, items: 100 },
    xlarge: { rows: 5000, sections: 100, items: 500 },
  };

  const config = sizes[size] || sizes.medium;

  return {
    simple: {},
    withProps: {
      title: "Test Title",
      items: Array.from({ length: config.items }, (_, i) => `Item ${i}`),
    },
    deepTree: { depth: 8, breadth: 4 },
    largeList: { count: config.rows },
    dataHeavy: {
      data: {
        title: "Data Table",
        description: "A table with lots of data",
        rows: Array.from({ length: config.rows }, (_, i) => ({
          id: i,
          name: `Row ${i}`,
          value: Math.random() * 1000,
          status: i % 2 === 0 ? "active" : "inactive",
          timestamp: new Date().toISOString(),
        })),
      },
    },
    mixedContent: {
      sections: Array.from({ length: config.sections }, (_, i) => ({
        title: `Section ${i}`,
        text: `This is the content for section ${i}. It contains some text that would be typical in a real application.`,
        items: Array.from({ length: 5 }, (_, j) => `Section ${i} Item ${j}`),
      })),
    },
  };
}
