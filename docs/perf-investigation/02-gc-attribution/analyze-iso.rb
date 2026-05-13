#!/usr/bin/env ruby
require "json"

RAILS_LOG = "/mnt/ssd/my-demos/rsc-benchmark/forks/rsc-benchmar/apps/ror-rsc/log/rails-prod.log"
RUN_DIR   = ARGV[0] or abort("usage: analyze-iso.rb <run-dir>")

# Read markers
window_start = {}
window_end   = {}
Dir.glob(File.join(RUN_DIR, "iso", "*.marker")).each do |f|
  label = File.basename(f, ".marker")
  window_start[label] = File.read(f).strip
  window_end[label]   = File.read(File.join(RUN_DIR, "iso", "#{label}.end_marker")).strip
end

text  = File.read(RAILS_LOG)
lines = text.lines

# Find marker line numbers
mark_lines_start = {}
mark_lines_end   = {}
lines.each_with_index do |ln, i|
  if ln =~ /\?marker=ISO-(\w+)-(START|END)-/
    label, kind = $1, $2
    if kind == "START"
      mark_lines_start[label] = i
    else
      mark_lines_end[label] = i
    end
  end
end

# Parse requests
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
  elsif ln.include?("[INSTR-BUILDONLY]")
    if ln =~ /props_bytes=(\d+)/
      r[:props_bytes] = $1.to_i
      r[:build_only] = true
    end
  elsif ln =~ /Processing by MegaBenchmarkTraditionalController#(\w+)/
    r[:action] = $1
  elsif ln =~ /Completed (\d+) [A-Za-z ]+ in (\d+)ms.*?GC: ([\d.]+)ms/
    r[:status] = $1.to_i
    r[:total_ms] = $2.to_i
    r[:gc_ms] = $3.to_f
    r[:completed_line] = i
  end
end

# Bucket
buckets = Hash.new { |h, k| h[k] = [] }
requests.each_value do |r|
  next unless r[:completed_line] && r[:gc_ms]
  mark_lines_start.each_key do |label|
    s = mark_lines_start[label]
    e = mark_lines_end[label]
    next unless s && e
    buckets[label] << r if r[:completed_line] > s && r[:completed_line] < e
  end
end

def stats(arr)
  return { n: 0 } if arr.empty?
  s = arr.sort
  n = s.length
  pct = ->(q) { s[((n - 1) * q).floor] }
  {
    n: n,
    p50: pct.call(0.5).round(2),
    p95: pct.call(0.95).round(2),
    mean: (s.sum.to_f / n).round(2),
    min: s.min.round(2),
    max: s.max.round(2),
  }
end

ordered = %w[build_only send_only full]
results = {}
ordered.each do |label|
  reqs = buckets[label] || []
  results[label] = {
    n: reqs.length,
    total_ms: stats(reqs.map { |r| r[:total_ms] }),
    gc_ms:    stats(reqs.map { |r| r[:gc_ms] }),
    httpx_ms: stats(reqs.map { |r| r[:httpx_round_trip_ms] }.compact),
    json_dump_ms: stats(reqs.map { |r| r[:json_dump_ms] }.compact),
    react_component_total_ms: stats(reqs.map { |r| r[:react_component_total_ms] }.compact),
  }
end

File.write(File.join(RUN_DIR, "iso-metrics.json"), JSON.pretty_generate(results))

puts ""
puts "Isolation sweep (u=500 p=1000 c=5000):"
puts ""
printf("%-12s %-3s %-10s %-9s %-10s %-10s %-10s\n",
       "endpoint", "n", "total_p50", "gc_p50", "gc_p95", "httpx_p50", "react_p50")
puts "-" * 80
ordered.each do |label|
  r = results[label]
  printf("%-12s %-3d %-10s %-9s %-10s %-10s %-10s\n",
    label, r[:n],
    r[:total_ms][:p50], r[:gc_ms][:p50], r[:gc_ms][:p95],
    r[:httpx_ms][:p50] == nil ? "-" : r[:httpx_ms][:p50],
    r[:react_component_total_ms][:p50] == nil ? "-" : r[:react_component_total_ms][:p50])
end
puts ""

# Attribution arithmetic
b = results["build_only"][:gc_ms][:p50]
s = results["send_only"][:gc_ms][:p50]
f = results["full"][:gc_ms][:p50]
puts "GC attribution (median ms):"
puts "  build_only (controller-alloc only):  #{b}"
puts "  send_only  (HTTPX/renderer/view only): #{s}"
puts "  full       (both):                    #{f}"
puts ""
puts "Cross-check:"
printf("  build_only + send_only ≈ full?  %s + %s = %s  vs  full %s\n",
       b, s, (b + s).round(2), f)
total_isolated = b + s
overlap = total_isolated - f
puts "  Sum exceeds full by #{overlap.round(2)} ms (Rails overhead double-counted in each)"
puts ""
puts "  build_only share: #{(b / f * 100).round(1)}%"
puts "  send_only  share: #{(s / f * 100).round(1)}%"

puts ""
puts "Wrote #{File.join(RUN_DIR, 'iso-metrics.json')}"
