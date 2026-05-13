#!/usr/bin/env bash
# Sweep payload sizes against /mega_benchmark_traditional and collect Rails-side
# GC time per request. The aim is to attribute the ~150 ms/req GC cost across:
# (1) controller allocation (pluck.map { hash }), (2) library round-trip path
# (HTTPX 1.4 MB body + 2.18 MB response), (3) baseline Ruby GC.

set -u
RUN_DIR="$1"
RAILS_LOG="/mnt/ssd/my-demos/rsc-benchmark/forks/rsc-benchmar/apps/ror-rsc/log/rails-prod.log"
mkdir -p "$RUN_DIR/per-point"

POINTS=(
  "u=0&p=0&c=0"
  "u=500&p=0&c=0"
  "u=500&p=1000&c=0"
  "u=500&p=1000&c=2500"
  "u=500&p=1000&c=5000"
)
LABELS=("000" "500-0-0" "500-1000-0" "500-1000-2500" "500-1000-5000")

WARMUP=10
N=25

echo "point,n,total_p50,total_p95,gc_p50,gc_p95,rt_p50,rt_p95,body_bytes,html_bytes" > "$RUN_DIR/metrics.csv"

# Big warmup across all points (mix) to warm JIT + caches
echo "== Big warmup =="
for i in $(seq 1 20); do
  for pt in "${POINTS[@]}"; do
    curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional?${pt}" || true
  done
done

# Mark a section in the log so we can scope the analysis
SECTION_MARK="GC-ATTR-SECTION-$(date -u +%s)"
echo "$SECTION_MARK" > /tmp/section_mark

# Hit each point
for idx in "${!POINTS[@]}"; do
  pt="${POINTS[$idx]}"
  label="${LABELS[$idx]}"
  echo ""
  echo "== Point: ${label}  (${pt}) =="

  # Per-point warmup
  for i in $(seq 1 ${WARMUP}); do
    curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional?${pt}" || true
  done

  # Marker line so we can isolate this point's requests in the log
  MARK="POINT-${label}-START-$(date -u +%s%N)"
  curl -s -o /dev/null --max-time 5 "http://127.0.0.1:3000/up?marker=${MARK}" || true
  echo "$MARK" > "$RUN_DIR/per-point/${label}.marker"

  # Measured
  for i in $(seq 1 ${N}); do
    curl -s -o /dev/null --max-time 30 "http://127.0.0.1:3000/mega_benchmark_traditional?${pt}"
  done

  END_MARK="POINT-${label}-END-$(date -u +%s%N)"
  curl -s -o /dev/null --max-time 5 "http://127.0.0.1:3000/up?marker=${END_MARK}" || true
  echo "$END_MARK" > "$RUN_DIR/per-point/${label}.end_marker"
  echo "done ${label}"
done

echo "$SECTION_MARK-END" >> /tmp/section_mark
echo ""
echo "Run complete. Log: $RAILS_LOG"
ls -la "$RUN_DIR/per-point/"
