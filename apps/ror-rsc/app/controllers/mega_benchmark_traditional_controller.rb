# frozen_string_literal: true

class MegaBenchmarkTraditionalController < ApplicationController
  layout "react_on_rails_default"

  # Accepts ?u=N&p=N&c=N to limit how many rows of each table go into props.
  # u=p=c=0 → empty arrays (measures fixed renderer round-trip cost)
  # Defaults to the full dataset (matches original).
  def index
    u_limit = params[:u]&.to_i
    p_limit = params[:p]&.to_i
    c_limit = params[:c]&.to_i

    stats_row = ActiveRecord::Base.connection.select_one(<<~SQL)
      SELECT (SELECT COUNT(*) FROM users) AS user_count,
             (SELECT COUNT(*) FROM posts) AS post_count,
             (SELECT COUNT(*) FROM comments) AS comment_count
    SQL

    users_rel    = User.order(:id)
    users_rel    = users_rel.limit(u_limit) if u_limit
    posts_rel    = Post.joins(:user).order("posts.id")
    posts_rel    = posts_rel.limit(p_limit) if p_limit
    comments_rel = Comment.joins(:user).order("comments.id")
    comments_rel = comments_rel.limit(c_limit) if c_limit

    @props = {
      timestamp: (Time.now.to_f * 1000).to_i,
      stats: {
        user_count:    stats_row["user_count"],
        post_count:    stats_row["post_count"],
        comment_count: stats_row["comment_count"],
      },
      users: users_rel.pluck(:id, :name, :email).map { |id, name, email|
        { id:, name:, email: }
      },
      posts: posts_rel.pluck("posts.id", "posts.title", "posts.body", "users.name").map { |id, title, body, author_name|
        { id:, title:, body:, author_name: }
      },
      comments: comments_rel.pluck("comments.id", "comments.body", "users.name").map { |id, body, user_name|
        { id:, body:, user_name: }
      },
    }
  end

  # === Experiment isolation actions (do not use in production) ===

  # Same allocations as `index` (pluck + map { hash } over 3 tables, builds @props),
  # but does NOT call the renderer. Isolates GC cost of building the props.
  def build_only
    u_limit = params[:u]&.to_i
    p_limit = params[:p]&.to_i
    c_limit = params[:c]&.to_i

    stats_row = ActiveRecord::Base.connection.select_one(<<~SQL)
      SELECT (SELECT COUNT(*) FROM users) AS user_count,
             (SELECT COUNT(*) FROM posts) AS post_count,
             (SELECT COUNT(*) FROM comments) AS comment_count
    SQL

    users_rel    = User.order(:id)
    users_rel    = users_rel.limit(u_limit) if u_limit
    posts_rel    = Post.joins(:user).order("posts.id")
    posts_rel    = posts_rel.limit(p_limit) if p_limit
    comments_rel = Comment.joins(:user).order("comments.id")
    comments_rel = comments_rel.limit(c_limit) if c_limit

    @props = {
      timestamp: (Time.now.to_f * 1000).to_i,
      stats: {
        user_count:    stats_row["user_count"],
        post_count:    stats_row["post_count"],
        comment_count: stats_row["comment_count"],
      },
      users: users_rel.pluck(:id, :name, :email).map { |id, name, email|
        { id:, name:, email: }
      },
      posts: posts_rel.pluck("posts.id", "posts.title", "posts.body", "users.name").map { |id, title, body, author_name|
        { id:, title:, body:, author_name: }
      },
      comments: comments_rel.pluck("comments.id", "comments.body", "users.name").map { |id, body, user_name|
        { id:, body:, user_name: }
      },
    }

    sink = @props.to_json
    Rails.logger.info { "[INSTR-BUILDONLY] props_bytes=#{sink.bytesize}" }
    render plain: "ok\n"
  end

  # Skip the controller-side allocation work. Build @props from a PRE-CACHED
  # structure on first hit, then reuse the SAME object reference forever.
  # View still calls react_component → renderer → response.
  # Isolates HTTPX/renderer path cost without controller allocation pressure.
  def send_only
    u_limit = params[:u]&.to_i || 500
    p_limit = params[:p]&.to_i || 1000
    c_limit = params[:c]&.to_i || 5000

    cache_key = "send_only:#{u_limit}:#{p_limit}:#{c_limit}"
    @props = self.class.send_only_cache[cache_key] ||= begin
      stats_row = ActiveRecord::Base.connection.select_one(<<~SQL)
        SELECT (SELECT COUNT(*) FROM users) AS user_count,
               (SELECT COUNT(*) FROM posts) AS post_count,
               (SELECT COUNT(*) FROM comments) AS comment_count
      SQL

      users_rel    = User.order(:id).limit(u_limit)
      posts_rel    = Post.joins(:user).order("posts.id").limit(p_limit)
      comments_rel = Comment.joins(:user).order("comments.id").limit(c_limit)

      {
        timestamp: (Time.now.to_f * 1000).to_i,
        stats: {
          user_count:    stats_row["user_count"],
          post_count:    stats_row["post_count"],
          comment_count: stats_row["comment_count"],
        },
        users: users_rel.pluck(:id, :name, :email).map { |id, name, email|
          { id:, name:, email: }
        },
        posts: posts_rel.pluck("posts.id", "posts.title", "posts.body", "users.name").map { |id, title, body, author_name|
          { id:, title:, body:, author_name: }
        },
        comments: comments_rel.pluck("comments.id", "comments.body", "users.name").map { |id, body, user_name|
          { id:, body:, user_name: }
        },
      }
    end

    render "index"
  end

  def self.send_only_cache
    @send_only_cache ||= {}
  end
end
