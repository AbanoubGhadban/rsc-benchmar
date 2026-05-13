# Direct probe: measure exactly what HTTPX::Transcoder::Form.encode does
# when ROR Pro hands it the renderingRequest form.

require "json"
require "httpx"
require "benchmark"

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
}

rails_context = {
  componentRegistryTimeout: 5000, railsEnv: "production", inMailer: false,
  i18nLocale: "en", i18nDefaultLocale: "en",
  rorVersion: "16.6.0", rorPro: true, rorProVersion: "16.6.0", serverSide: true,
}

js_src = <<~JS
  (function(componentName = "MegaBenchmarkTraditional", props = undefined) {
    var railsContext = #{rails_context.to_json};
    var usedProps = typeof props === 'undefined' ? #{props.to_json} : props;
    return ReactOnRails['serverRenderReactComponent']({
      name: componentName,
      domNodeId: "MegaBenchmarkTraditional-react-component-0",
      props: usedProps,
      trace: false,
      railsContext: railsContext,
      throwJsErrors: true,
      renderingReturnsPromises: false,
    });
  })()
JS

form = {
  "gemVersion"       => "16.6.0",
  "protocolVersion"  => "2.0.0",
  "password"         => "devPassword",
  "renderingRequest" => js_src,
}

def with_gc_metrics(label, iters)
  GC.start
  before = GC.stat.slice(:total_allocated_objects, :minor_gc_count, :major_gc_count, :time)
  t = Benchmark.realtime { iters.times { yield } }
  after = GC.stat.slice(:total_allocated_objects, :minor_gc_count, :major_gc_count, :time)
  printf("%-55s wall=%6.1fms  gc=%6.1fms  obj/iter=%-10d  minor=%2d  major=%d\n",
         label, t * 1000, after[:time] - before[:time],
         (after[:total_allocated_objects] - before[:total_allocated_objects]) / iters,
         after[:minor_gc_count] - before[:minor_gc_count],
         after[:major_gc_count] - before[:major_gc_count])
end

ITERS = 30

puts "Probing the path ROR Pro actually takes (iters=#{ITERS}):"
puts

# 1) HTTPX::Transcoder::Form.encode — exactly what request.rb calls
with_gc_metrics("HTTPX::Transcoder::Form.encode(form)", ITERS) do
  encoder = HTTPX::Transcoder::Form.encode(form)
  encoder.to_s
end

# 2) Build the same form body manually with URI.encode_www_form
with_gc_metrics("URI.encode_www_form(form.to_a)", ITERS) do
  URI.encode_www_form(form.to_a)
end

# 3) JSON.generate of the same form (the alternative encoding path)
with_gc_metrics("JSON.generate(form)", ITERS) do
  JSON.generate(form)
end

# 4) Direct: just the renderingRequest field as JSON (smallest alternative)
with_gc_metrics("{renderingRequest: js}.to_json", ITERS) do
  { renderingRequest: js_src }.to_json
end

# Sanity check on sizes
form_body  = HTTPX::Transcoder::Form.encode(form).to_s
json_body  = JSON.generate(form)
puts
puts "Body sizes:"
puts "  HTTPX form-encoded: #{form_body.bytesize} bytes (#{(form_body.bytesize/1024.0).round(1)} KB)"
puts "  JSON-encoded:       #{json_body.bytesize} bytes (#{(json_body.bytesize/1024.0).round(1)} KB)"
puts "  Wire savings if JSON: #{form_body.bytesize - json_body.bytesize} bytes (#{((1 - json_body.bytesize.to_f/form_body.bytesize) * 100).round(1)}% smaller)"
