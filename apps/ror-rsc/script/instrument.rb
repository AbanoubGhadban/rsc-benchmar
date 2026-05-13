# frozen_string_literal: true
# rails runner script/instrument.rb
# Isolates per-phase costs of the /mega_benchmark_traditional workload on the Ruby side.
require "benchmark"
require "json"
require "zlib"

# Warm up class loading
User.first; Post.first; Comment.first

trial = lambda do
  t = {}
  pluck_users    = Benchmark.realtime do
    @users = User.order(:id).pluck(:id, :name, :email)
                 .map { |id, name, email| { id:, name:, email: } }
  end
  pluck_posts    = Benchmark.realtime do
    @posts = Post.joins(:user).order("posts.id")
                 .pluck("posts.id", "posts.title", "posts.body", "users.name")
                 .map { |id, title, body, author_name| { id:, title:, body:, author_name: } }
  end
  pluck_comments = Benchmark.realtime do
    @comments = Comment.joins(:user).order("comments.id")
                       .pluck("comments.id", "comments.body", "users.name")
                       .map { |id, body, user_name| { id:, body:, user_name: } }
  end
  pluck_stats    = Benchmark.realtime do
    row = ActiveRecord::Base.connection.select_one(<<~SQL)
      SELECT (SELECT COUNT(*) FROM users) AS user_count,
             (SELECT COUNT(*) FROM posts) AS post_count,
             (SELECT COUNT(*) FROM comments) AS comment_count
    SQL
    @stats = { user_count: row["user_count"], post_count: row["post_count"], comment_count: row["comment_count"] }
  end

  full_props = nil
  build_hash = Benchmark.realtime do
    full_props = {
      timestamp: (Time.now.to_f * 1000).to_i,
      stats: @stats,
      users: @users,
      posts: @posts,
      comments: @comments,
    }
  end

  json_str = nil
  json_dump = Benchmark.realtime { json_str = full_props.to_json }
  json_bytes = json_str.bytesize

  gzip_bytes = 0
  compress = Benchmark.realtime do
    gz = Zlib::Deflate.deflate(json_str, Zlib::DEFAULT_COMPRESSION)
    gzip_bytes = gz.bytesize
  end

  parse = Benchmark.realtime { JSON.parse(json_str) }   # Ruby-side parse cost (proxy for node JSON.parse — they're similar order of magnitude)

  t = {
    sql_users:    pluck_users * 1000,
    sql_posts:    pluck_posts * 1000,
    sql_comments: pluck_comments * 1000,
    sql_stats:    pluck_stats * 1000,
    build_hash:   build_hash * 1000,
    json_dump:    json_dump * 1000,
    json_parse:   parse * 1000,
    gzip_dump:    compress * 1000,
    json_bytes:   json_bytes,
    gzip_bytes:   gzip_bytes,
  }
  t
end

# Warm runs
3.times { trial.call }

# Measured runs
N = 10
samples = N.times.map { trial.call }

puts "=== mega_benchmark — per-phase Ruby cost, n=#{N} ==="
keys = %i[sql_stats sql_users sql_posts sql_comments build_hash json_dump json_parse gzip_dump]
fmt  = "%-13s  median=%7.2f ms   mean=%7.2f ms   p95=%7.2f ms"
keys.each do |k|
  vals = samples.map { |s| s[k] }.sort
  median = vals[vals.size / 2]
  mean   = vals.sum / vals.size.to_f
  p95    = vals[(vals.size * 0.95).floor]
  puts(fmt % [k, median, mean, p95])
end

puts ""
puts "Total *Ruby-side* (sum of all phases above):"
totals = samples.map { |s| keys.sum { |k| s[k] } }.sort
puts "  median = %.2f ms" % totals[totals.size / 2]
puts "  mean   = %.2f ms" % (totals.sum / totals.size.to_f)

puts ""
puts "Payload sizes:"
sample = samples.last
puts "  JSON props bytes: #{sample[:json_bytes]}"
puts "  Gzipped bytes:    #{sample[:gzip_bytes]}  (ratio %.1f×)" % (sample[:json_bytes].to_f / sample[:gzip_bytes])
