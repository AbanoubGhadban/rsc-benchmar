# frozen_string_literal: true

class MegaBenchmarkTraditionalController < ApplicationController
  layout "react_on_rails_default"

  def index
    # FAIRNESS FIX: use pluck instead of `.select(:cols).map { Hash.new }`.
    # The original code instantiates 500 AR objects + builds 500 hashes for users
    # (and 1000 + 5000 for posts/comments) — much slower than pluck for read-only
    # data going straight to JSON. Next.js gets raw rows from `pg` (no ORM hops);
    # this brings Rails closer.
    #
    # NOTE: I tried also parallelizing the 4 queries with Threads/Fibers to match
    # Next.js's `Promise.all`, but Ruby 3.3.0 + Rails 7.2 segfaults on Async +
    # ActiveRecord and `Thread.new + .value` hits "undefined method
    # set_client_encoding for nil" on the postgres adapter. Working around that
    # would require upgrading to a fiber-aware web server (Falcon). Left as
    # sequential here so the result reflects only the safe optimizations.
    stats_row = ActiveRecord::Base.connection.select_one(<<~SQL)
      SELECT (SELECT COUNT(*) FROM users) AS user_count,
             (SELECT COUNT(*) FROM posts) AS post_count,
             (SELECT COUNT(*) FROM comments) AS comment_count
    SQL

    @props = {
      timestamp: (Time.now.to_f * 1000).to_i,
      stats: {
        user_count:    stats_row["user_count"],
        post_count:    stats_row["post_count"],
        comment_count: stats_row["comment_count"],
      },
      users: User.order(:id).pluck(:id, :name, :email).map { |id, name, email|
        { id:, name:, email: }
      },
      posts: Post.joins(:user).order("posts.id")
                 .pluck("posts.id", "posts.title", "posts.body", "users.name")
                 .map { |id, title, body, author_name|
        { id:, title:, body:, author_name: }
      },
      comments: Comment.joins(:user).order("comments.id")
                       .pluck("comments.id", "comments.body", "users.name")
                       .map { |id, body, user_name|
        { id:, body:, user_name: }
      },
    }
  end
end
