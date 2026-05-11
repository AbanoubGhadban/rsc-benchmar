# frozen_string_literal: true

class MegaBenchmarkTraditionalController < ApplicationController
  layout "react_on_rails_default"

  def index
    @props = {
      timestamp: (Time.now.to_f * 1000).to_i,
      stats: {
        user_count: User.count,
        post_count: Post.count,
        comment_count: Comment.count
      },
      users: User.select(:id, :name, :email).order(:id).map do |u|
        { id: u.id, name: u.name, email: u.email }
      end,
      posts: Post.joins(:user)
                 .select("posts.id, posts.title, posts.body, users.name as author_name")
                 .order("posts.id")
                 .map do |p|
        { id: p.id, title: p.title, body: p.body, author_name: p.author_name }
      end,
      comments: Comment.joins(:user)
                       .select("comments.id, comments.body, users.name as user_name")
                       .order("comments.id")
                       .map do |c|
        { id: c.id, body: c.body, user_name: c.user_name }
      end
    }
  end
end
