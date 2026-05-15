#!/usr/bin/env bash
# Paired-curl A/B: alternate one request to EXP (port 3000, change applied) and
# one to BASE (port 3002, no change) in a tight loop. Records wall time per
# request to per-side CSV files. Any time-varying environmental noise (thermal,
# OS background, network) hits both sides roughly equally and cancels in the
# pairwise comparison.

set -u
PATHS=(
  "/hello_world|hello"
  "/heavy_benchmark_traditional|heavy"
  "/mega_benchmark_traditional?u=500&p=1000&c=5000|mega"
)
EXP_PORT=3000
BASE_PORT=3002
OUT=${1:-/tmp/paired-curl}
WARMUP=20
N=30

mkdir -p "$OUT"

for entry in "${PATHS[@]}"; do
  path="${entry%%|*}"
  label="${entry##*|}"
  exp_csv="$OUT/$label.exp.csv"
  base_csv="$OUT/$label.base.csv"
  : > "$exp_csv"; : > "$base_csv"

  echo "== $label ($path) =="
  echo "  warmup ${WARMUP}x..."
  for i in $(seq 1 ${WARMUP}); do
    curl -s -o /dev/null --max-time 60 "http://127.0.0.1:${EXP_PORT}${path}" >/dev/null
    curl -s -o /dev/null --max-time 60 "http://127.0.0.1:${BASE_PORT}${path}" >/dev/null
  done

  echo "  measure ${N} pairs (alternating)..."
  for i in $(seq 1 ${N}); do
    # Alternate which side goes first to avoid systematic bias.
    if (( i % 2 == 0 )); then
      t_exp=$(curl -s -o /dev/null --max-time 60 -w '%{time_total}\n' "http://127.0.0.1:${EXP_PORT}${path}")
      t_base=$(curl -s -o /dev/null --max-time 60 -w '%{time_total}\n' "http://127.0.0.1:${BASE_PORT}${path}")
    else
      t_base=$(curl -s -o /dev/null --max-time 60 -w '%{time_total}\n' "http://127.0.0.1:${BASE_PORT}${path}")
      t_exp=$(curl -s -o /dev/null --max-time 60 -w '%{time_total}\n' "http://127.0.0.1:${EXP_PORT}${path}")
    fi
    echo "$t_exp" >> "$exp_csv"
    echo "$t_base" >> "$base_csv"
  done

  ruby -e "
    exp = File.readlines('$exp_csv').map { |l| (l.to_f * 1000).round(2) }.sort
    bas = File.readlines('$base_csv').map { |l| (l.to_f * 1000).round(2) }.sort
    n = [exp.size, bas.size].min
    pct = ->(arr, q) { arr[((arr.size - 1) * q).floor] }
    puts \"  exp:  n=#{exp.size} p50=#{pct.call(exp, 0.5)} ms  p95=#{pct.call(exp, 0.95)} ms\"
    puts \"  base: n=#{bas.size} p50=#{pct.call(bas, 0.5)} ms  p95=#{pct.call(bas, 0.95)} ms\"
    puts \"  delta median: #{(pct.call(bas, 0.5) - pct.call(exp, 0.5)).round(2)} ms  (base − exp)\"
  "
done

echo ""
echo "Saved per-request CSVs under $OUT"
