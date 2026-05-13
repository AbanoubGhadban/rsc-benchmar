# Probe: is "the renderer round-trip path produces ~92 ms of GC" caused by
# (a) the FACT that Ruby allocates 1.16 + 1.4 + 2.18 MB of strings per request,
# (b) HTTPX-rb's specific allocation pattern (many small intermediate strings),
# (c) Rails view rendering's specific allocation pattern.
#
# This script does (a) ONLY — in pure Ruby with NO Rails, NO HTTPX, NO ROR Pro.
# Just builds strings of those exact sizes from a cached props structure, exactly
# how a hand-written minimal client would.

require "json"
require "uri"
require "benchmark"

# Build the same shape of props the controller would, once
N_USERS = 500
N_POSTS = 1000
N_COMMENTS = 5000

props = {
  timestamp: Time.now.to_i,
  stats: { user_count: N_USERS, post_count: N_POSTS, comment_count: N_COMMENTS },
  users: (1..N_USERS).map { |i| { id: i, name: "User #{i}", email: "user#{i}@example.com" } },
  posts: (1..N_POSTS).map { |i| { id: i, title: "Post #{i}",
                                   body: "This is the body of post #{i}. #{("lorem ipsum dolor sit amet ") * 8}",
                                   author_name: "User #{(i % N_USERS) + 1}" } },
  comments: (1..N_COMMENTS).map { |i| { id: i,
                                          body: "This is comment #{i}. #{("commentary text here ") * 4}",
                                          user_name: "User #{(i % N_USERS) + 1}" } },
}.freeze

# Pre-render an HTML-sized "response body" so we can simulate receiving it
HTML_BYTES = "x" * 2_186_000
HTML_BYTES.freeze

def gc_stats
  GC.stat.slice(:total_allocated_objects, :total_freed_objects, :minor_gc_count, :major_gc_count, :time)
end

def with_gc_metrics(label, iters = 30)
  # Force GC before sampling to start clean
  GC.start
  before = gc_stats
  t = Benchmark.realtime do
    iters.times { yield }
  end
  after = gc_stats
  delta_obj   = after[:total_allocated_objects] - before[:total_allocated_objects]
  delta_gc_ms = after[:time] - before[:time]                       # GC.stat[:time] is in ms
  delta_minor = after[:minor_gc_count] - before[:minor_gc_count]
  delta_major = after[:major_gc_count] - before[:major_gc_count]
  printf("%-50s wall=%6.1fms  gc=%6.1fms  obj/iter=%-9d  minor=%2d  major=%d\n",
         label, t * 1000, delta_gc_ms, delta_obj / iters, delta_minor, delta_major)
  { label: label, wall_ms: (t * 1000).round(1), gc_ms: delta_gc_ms.round(1),
    obj_per_iter: (delta_obj / iters), minor: delta_minor, major: delta_major }
end

ITERS = 30
results = []

puts "== Pure Ruby string-allocation probes (iters=#{ITERS}) =="
puts

# 1) JSON.generate the props — exactly what every request must do
results << with_gc_metrics("JSON.generate(props)  -> 1.16 MB string", ITERS) do
  JSON.generate(props)
end

# 2) Same, but with frozen string optimization (just generates the JSON string)
results << with_gc_metrics("props.to_json (Rails Hash#to_json)", ITERS) do
  props.to_json
end

# 3) Build a URL-encoded form body — what HTTPX would do
results << with_gc_metrics("URI.encode_www_form_component on 1.1 MB", ITERS) do
  big = JSON.generate(props)
  URI.encode_www_form_component(big)
end

# 4) Just allocate a fresh 2.18 MB String (what receiving the HTTP response does)
results << with_gc_metrics("String.new(2.18 MB) — simulate receive", ITERS) do
  String.new(capacity: HTML_BYTES.bytesize).concat(HTML_BYTES)
end

# 5) Concatenate two 2.18 MB strings — what the Rails view does to wrap the rendered HTML
big_template = "<html><body>".dup
results << with_gc_metrics("View-wrap: layout_open + render + layout_close", ITERS) do
  out = "<html><body>"
  out += HTML_BYTES
  out += "</body></html>"
  out
end

# 6) FULL pipeline simulation: JSON-encode + URL-encode + receive + view-wrap
results << with_gc_metrics("FULL pipeline simulation (a + c + e)", ITERS) do
  json_body = JSON.generate(props)
  form_body = URI.encode_www_form_component(json_body)
  resp      = String.new(capacity: HTML_BYTES.bytesize).concat(HTML_BYTES)
  out       = "<html><body>" + resp + "</body></html>"
  [form_body.bytesize, resp.bytesize, out.bytesize]
end

puts
puts "Per-iter GC cost for FULL pipeline simulation:"
full = results.last
printf("  wall %.2f ms/iter, gc %.2f ms/iter, objects allocated %d/iter\n",
       full[:wall_ms] / ITERS, full[:gc_ms].to_f / ITERS, full[:obj_per_iter])

require "json"
File.write(ARGV[0] || "/tmp/ruby-strings.json", JSON.pretty_generate(results))
