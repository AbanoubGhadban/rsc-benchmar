#!/usr/bin/env ruby
# Parse the Rails production log and bucket each request by sweep-point marker.
# Emit per-point: median/p95 for total wall, GC, httpx round-trip, props/html bytes.

require "json"

RAILS_LOG = ENV.fetch("RAILS_LOG") { File.expand_path("../../../apps/ror-rsc/log/production.log", __dir__) }
RUN_DIR   = ARGV[0] or abort("usage: analyze.rb <run-dir>")

# Read all marker pairs
points = []
Dir.glob(File.join(RUN_DIR, "per-point", "*.marker")).each do |f|
  label = File.basename(f, ".marker")
  start_mark = File.read(f).strip
  end_mark   = File.read(File.join(RUN_DIR, "per-point", "#{label}.end_marker")).strip
  points << { label:, start_mark:, end_mark: }
end

# Parse the log line by line, tracking which point window we're in.
# Each /mega_benchmark_traditional request has a UUID. Within that UUID we find:
#   [INSTR] props_bytes=<a> json_dump_ms=<b> react_component_total_ms=<c> html_bytes=<d>
#   [INSTR-RORP-NETWORK] httpx_round_trip_ms=<e>
#   Completed 200 OK in <f>ms (Views: <g>ms | ActiveRecord: <h>ms ... GC: <i>ms)
# Markers are GET /up?marker=POINT-<label>-(START|END)-<ts>
text = File.read(RAILS_LOG)
lines = text.lines

# Pass 1: detect marker request line numbers
window_start = {}
window_end   = {}
lines.each_with_index do |ln, i|
  if ln =~ /\?marker=POINT-([^-]+(?:-[\d]+)*)-(START|END)-/
    label, kind = $1, $2
    if kind == "START"
      window_start[label] = i
    else
      window_end[label] = i
    end
  end
end

# Pass 2: extract per-request structs keyed by request UUID, with the line index
# of the Completed line (so we can decide which window the request fell in).
requests = {}
lines.each_with_index do |ln, i|
  uuid = ln =~ /\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/ ? $1 : next
  r = (requests[uuid] ||= { uuid: uuid })
  if ln.include?("[INSTR] ")
    if ln =~ /props_bytes=(\d+) json_dump_ms=([\d.]+) react_component_total_ms=([\d.]+) html_bytes=(\d+)/
      r[:props_bytes] = $1.to_i
      r[:json_dump_ms] = $2.to_f
      r[:react_component_total_ms] = $3.to_f
      r[:html_bytes] = $4.to_i
    end
  elsif ln.include?("[INSTR-RORP-NETWORK]")
    if ln =~ /httpx_round_trip_ms=([\d.]+)/
      r[:httpx_round_trip_ms] = $1.to_f
    end
  elsif ln =~ /Completed (\d+) [A-Za-z ]+ in (\d+)ms.*?GC: ([\d.]+)ms/
    next unless ln.include?("mega_benchmark") || ln.include?("MegaBenchmarkTraditionalController") || r[:props_bytes]
    r[:status] = $1.to_i
    r[:total_ms] = $2.to_i
    r[:gc_ms] = $3.to_f
    r[:completed_line] = i
  end
end

# Pass 3: bucket each completed request into the (single) sweep point whose
# window it falls inside.
buckets = Hash.new { |h, k| h[k] = [] }
requests.each_value do |r|
  next unless r[:completed_line] && r[:gc_ms]
  # Find window where start_line < completed_line < end_line
  window_start.each_key do |label|
    s = window_start[label]
    e = window_end[label]
    next unless s && e
    buckets[label] << r if r[:completed_line] > s && r[:completed_line] < e
  end
end

def stats(arr)
  arr = arr.compact
  return { n: 0 } if arr.empty?
  s = arr.sort
  n = s.length
  pct = ->(q) { v = s[((n - 1) * q).floor]; v.is_a?(Numeric) ? v.round(2) : nil }
  {
    n: n,
    p50: pct.call(0.5),
    p95: pct.call(0.95),
    mean: (s.sum(0.0) / n).round(2),
    min: s.min,
    max: s.max,
  }
end

ordered_labels = %w[000 500-0-0 500-1000-0 500-1000-2500 500-1000-5000]
results = {}
ordered_labels.each do |label|
  reqs = buckets[label] || []
  results[label] = {
    n: reqs.length,
    total_ms: stats(reqs.map { |r| r[:total_ms] }),
    gc_ms:    stats(reqs.map { |r| r[:gc_ms] }),
    httpx_ms: stats(reqs.map { |r| r[:httpx_round_trip_ms] }),
    react_component_total_ms: stats(reqs.map { |r| r[:react_component_total_ms] }.compact),
    json_dump_ms: stats(reqs.map { |r| r[:json_dump_ms] }.compact),
    props_bytes:  reqs.map { |r| r[:props_bytes] }.compact.first,
    html_bytes:   reqs.map { |r| r[:html_bytes] }.compact.first,
  }
end

File.write(File.join(RUN_DIR, "metrics.json"), JSON.pretty_generate(results))

# Also CSV
File.open(File.join(RUN_DIR, "metrics.csv"), "w") do |f|
  f.puts "label,n,total_p50,total_p95,gc_p50,gc_p95,httpx_p50,httpx_p95,react_p50,json_p50,props_bytes,html_bytes"
  ordered_labels.each do |label|
    r = results[label]
    f.puts [
      label, r[:n],
      r[:total_ms][:p50], r[:total_ms][:p95],
      r[:gc_ms][:p50], r[:gc_ms][:p95],
      r[:httpx_ms][:p50], r[:httpx_ms][:p95],
      r[:react_component_total_ms][:p50],
      r[:json_dump_ms][:p50],
      r[:props_bytes], r[:html_bytes]
    ].join(",")
  end
end

# Print a human table
puts ""
puts "label              n   total_p50  gc_p50   httpx_p50  react_p50  json_p50  props_KB  html_KB"
ordered_labels.each do |label|
  r = results[label]
  printf("%-18s %-3d %-10s %-8s %-10s %-10s %-9s %-9s %s\n",
    label, r[:n],
    r[:total_ms][:p50], r[:gc_ms][:p50],
    r[:httpx_ms][:p50], r[:react_component_total_ms][:p50],
    r[:json_dump_ms][:p50],
    r[:props_bytes] ? (r[:props_bytes]/1024) : "-",
    r[:html_bytes] ? (r[:html_bytes]/1024) : "-")
end
puts ""
puts "Wrote: #{File.join(RUN_DIR, "metrics.csv")}"
puts "Wrote: #{File.join(RUN_DIR, "metrics.json")}"
