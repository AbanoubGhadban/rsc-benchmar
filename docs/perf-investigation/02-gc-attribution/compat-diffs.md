# Compat diffs introduced for this experiment

These are non-subject-of-test changes added so the GC attribution sweep can run.

1. **`forks/rsc-benchmar/apps/ror-rsc/config/routes.rb`** — added two routes
   `mega_benchmark_traditional/build_only` and `mega_benchmark_traditional/send_only`
   pointing at the same controller. Reason: experiment requires two isolation actions.

2. **`forks/rsc-benchmar/apps/ror-rsc/app/controllers/mega_benchmark_traditional_controller.rb`** —
   added two actions:
   - `build_only`: same `pluck + map { hash }` work as `index`, plus the same
     `@props.to_json` work, then `render plain: "ok"` (skips view + renderer).
     Isolates the **controller-allocation** contribution to GC.
   - `send_only`: returns a class-memoized `@props` (built once, reused forever)
     and renders the normal `index` view (which calls react_component → renderer).
     Isolates the **HTTPX/renderer/view** contribution to GC.

Neither change touches what we're measuring (Ruby GC behavior, HTTPX-rb path,
ROR Pro path). They only carve the existing workflow into three isolation points.
