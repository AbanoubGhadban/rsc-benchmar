#!/usr/bin/env bash
# Isolation sweep: three endpoints, all u=500&p=1000&c=5000.
#   build_only — controller allocs, no renderer call
#   send_only  — no controller allocs (memoized props), full renderer call + view
#   full       — both (matches original /mega_benchmark_traditional)

set -u
RUN_DIR="$1"
QS="u=500&p=1000&c=5000"

# Big initial warmup
echo "== Big warmup =="
for i in $(seq 1 30); do
  curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional?${QS}" || true
  curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional/build_only?${QS}" || true
  curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional/send_only?${QS}" || true
done

# Pre-warm send_only cache key
curl -s -o /dev/null --max-time 60 "http://127.0.0.1:3000/mega_benchmark_traditional/send_only?${QS}"

LABELS=(build_only send_only full)
PATHS=(
  "/mega_benchmark_traditional/build_only"
  "/mega_benchmark_traditional/send_only"
  "/mega_benchmark_traditional"
)

mkdir -p "$RUN_DIR/iso"

for idx in "${!LABELS[@]}"; do
  label="${LABELS[$idx]}"
  path="${PATHS[$idx]}"
  echo ""
  echo "== Iso: ${label} =="

  for i in $(seq 1 10); do
    curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000${path}?${QS}"
  done

  MARK="ISO-${label}-START-$(date -u +%s%N)"
  curl -s -o /dev/null --max-time 5 "http://127.0.0.1:3000/up?marker=${MARK}"
  echo "$MARK" > "$RUN_DIR/iso/${label}.marker"

  for i in $(seq 1 30); do
    curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000${path}?${QS}"
  done

  END_MARK="ISO-${label}-END-$(date -u +%s%N)"
  curl -s -o /dev/null --max-time 5 "http://127.0.0.1:3000/up?marker=${END_MARK}"
  echo "$END_MARK" > "$RUN_DIR/iso/${label}.end_marker"
  echo "done ${label}"
done

echo ""
echo "Iso run complete"
