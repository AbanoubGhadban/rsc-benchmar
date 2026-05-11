/**
 * RSC HTTP Server
 * Serves Flight payload for load testing
 */

import { createServer } from "http";
import React from "react";
import { renderToPipeableStream } from "react-server-dom-webpack/server.node";
import {
  SimpleStatic,
  WithProps,
  DeepTree,
  LargeList,
  DataHeavy,
  MixedContent,
  generateTestData,
} from "../../shared/components/TestComponents.js";

const testData = generateTestData("medium");
const webpackMap = {};

const routes = {
  "/simple": { Component: SimpleStatic, props: {} },
  "/with-props": { Component: WithProps, props: testData.withProps },
  "/deep-tree": { Component: DeepTree, props: testData.deepTree },
  "/large-list": { Component: LargeList, props: { count: 500 } },
  "/data-heavy": { Component: DataHeavy, props: testData.dataHeavy },
  "/mixed": { Component: MixedContent, props: testData.mixedContent },
};

const PORT = process.env.PORT || 3002;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = routes[url.pathname];

  if (!route) {
    res.writeHead(404);
    res.end("Not found. Available routes: " + Object.keys(routes).join(", "));
    return;
  }

  const { Component, props } = route;
  const element = React.createElement(Component, props);

  res.writeHead(200, {
    "Content-Type": "text/x-component",
    "Transfer-Encoding": "chunked",
  });

  try {
    const { pipe } = renderToPipeableStream(element, webpackMap);
    pipe(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Error");
  }
});

server.listen(PORT, () => {
  console.log(`RSC Flight server listening on port ${PORT}`);
  console.log(`Routes: ${Object.keys(routes).join(", ")}`);
});
