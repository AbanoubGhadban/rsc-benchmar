/**
 * Traditional SSR HTTP Server
 * For load testing with autocannon
 */

import { createServer } from "http";
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

const testData = generateTestData("medium");

const routes = {
  "/simple": { Component: SimpleStatic, props: {} },
  "/with-props": { Component: WithProps, props: testData.withProps },
  "/deep-tree": { Component: DeepTree, props: testData.deepTree },
  "/large-list": { Component: LargeList, props: { count: 500 } },
  "/data-heavy": { Component: DataHeavy, props: testData.dataHeavy },
  "/mixed": { Component: MixedContent, props: testData.mixedContent },
};

const PORT = process.env.PORT || 3001;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const streaming = url.searchParams.get("stream") === "true";
  const route = routes[url.pathname];

  if (!route) {
    res.writeHead(404);
    res.end("Not found. Available routes: " + Object.keys(routes).join(", "));
    return;
  }

  const { Component, props } = route;
  const element = React.createElement(Component, props);

  if (streaming) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const { pipe } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(res);
      },
      onError(err) {
        console.error(err);
        res.statusCode = 500;
        res.end("Error");
      },
    });
  } else {
    const html = renderToString(element);
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(html),
    });
    res.end(html);
  }
});

server.listen(PORT, () => {
  console.log(`Traditional SSR server listening on port ${PORT}`);
  console.log(`Routes: ${Object.keys(routes).join(", ")}`);
  console.log(`Add ?stream=true for streaming mode`);
});
