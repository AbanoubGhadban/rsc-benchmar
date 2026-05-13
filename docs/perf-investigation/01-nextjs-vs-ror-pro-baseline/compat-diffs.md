# Compat / setup diffs (not the subject under test)

Diffs introduced only to make the experiment runnable. None of these affect the SSR path of either subject.

## Next.js app

1. **Pages Router scaffolded by hand** — `pages/_document.jsx`, `pages/_app.jsx`, `pages/bench/[scale].jsx`. Required because the user wanted "Pages Router, no RSC, no caching". `_app.jsx` adds a one-line `performance.mark('hydrated')` in `useEffect` so the web-vitals probe can measure hydration completion. (No effect on rendering performance.)
2. **`getServerSideProps` returns a `Cache-Control: no-store` header.** Forces SSR each request, no edge / browser cache. Demanded by the user's "no caching" constraint.
3. **Workload component copied into `apps/nextjs/components/Workload.jsx`.** First tried a shared workspace package (`bench-shared`); Turbopack refused to resolve symlinked JSX, Webpack mode tripped on `react` resolution from outside the project. Copying is simpler. md5 hash verified identical to `apps/shared/components/Workload.jsx` and to `apps/rails_ror_pro/app/javascript/src/Bench/ror_components/Workload.jsx`.

## Rails + ROR Pro app

1. **`gem "connection_pool", "< 3.0"`** — `connection_pool` 3.0.2 uses Ruby 3.4 syntax (`anonymous keyword rest parameter is also used within block`), the local Ruby is 3.3.0. Pinned to a 3.3-compatible major.
2. **`gem "sqlite3", ">= 1.4"`** — Rails eager-loads `ApplicationRecord` and requires the AR adapter on boot in production. SQLite is the default & lightest choice; never queried at runtime (bench controller has no AR).
3. **`enforce_private_server_bundles = false`** in `config/initializers/react_on_rails.rb`. Shakapacker 8.4 does not yet support `private_output_path` natively. The server bundle still lives in `ssr-generated/`, but ROR doesn't refuse to read it. No effect on bench (server bundle is loaded once at node-renderer boot).
4. **`random_dom_id = false`** in ROR initializer. ROR itself prints a hint that random DOM IDs cost extra perf. Setting it to false is the documented optimization, applied symmetrically by ROR's own guidance. Reduces overhead per `react_component` call. Recorded here for transparency.
5. **Removed the `babel` field from `package.json`** and let Shakapacker's `javascript_transpiler: swc` setting kick in. The generated `package.json` had a babel preset that resolved a plugin (`babel-plugin-transform-react-remove-prop-types`) not in deps. SWC is now what JIT-builds the asset graph. Both client and server bundle minified by SWC + Terser. (Next.js also uses SWC in `next build`.)
6. **Stripped-down `app/views/layouts/application.html.erb`** — removed sprockets `stylesheet_link_tag "application"`, manifest/icon link tags. The default generator templates assume a CSS pipeline + PWA icons we don't have. The remaining layout is `<title>`, viewport, csrf meta, `javascript_pack_tag "application"`, and the yield. Matches Next.js layout fidelity (Next.js also injects `<title>`, viewport, csrf-free, and the chunk script tags).
7. **`config.force_ssl = false`** in `production.rb`. Default Rails 7.2 production force-redirects to https. We bench over plain HTTP on localhost.
8. **`config.action_controller.perform_caching = false`** + `config.cache_store = :null_store`. Explicit "no caching" for action/fragment caching — already off by `prerender_caching = false` on the ROR Pro side, but doubly explicit.
9. **Node-renderer `additionalContext`** must include `MessageChannel` (from `worker_threads`), `queueMicrotask`, `performance`, `TextEncoder`, `TextDecoder`. The default `{URL, AbortController}` in the dummy app is insufficient for React 19's scheduler, which references `MessageChannel`. Without it, SSR fails with `ReferenceError: MessageChannel is not defined`. This is required-for-correctness, not a perf tweak — and it is the same V8 build/version used by Next.js (Node 22.12).

10. **`config.middleware.use Rack::Deflater`** (added in the fairness addendum, `config/application.rb`). Rails out-of-the-box has no HTTP compression middleware; Next.js's `next start` compresses dynamic responses by default. Without this, ROR Pro HTML was sent uncompressed while Next.js HTML was gzipped — unfair on bytes-on-wire. Symmetric gzip after this diff; brotli still absent on both (Next.js doesn't ship it, no `rack-brotli` added).

## Both apps

- Run on **Node v22.12.0** (matches `react_on_rails_v16.3/.nvmrc`). Same runtime on both sides for fairness.
- `pnpm-lock`/`package-lock` unchanged from generator output except for the local `react-on-rails-pro` + `react-on-rails-pro-node-renderer` yalc links.
