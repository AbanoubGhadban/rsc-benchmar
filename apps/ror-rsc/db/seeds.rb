puts "Seeding database..."

# Create users
puts "Creating 500 users..."
users = 500.times.map do |i|
  User.create!(
    name: "User #{i + 1}",
    email: "user#{i + 1}@example.com"
  )
end

# Create posts
puts "Creating 1000 posts..."
posts = 1000.times.map do |i|
  Post.create!(
    title: "Post #{i + 1}",
    body: "This is the body of post #{i + 1}. " * 10,
    user: users.sample
  )
end

# Create comments
puts "Creating 5000 comments..."
5000.times do |i|
  Comment.create!(
    body: "This is comment #{i + 1}. " * 5,
    post: posts.sample,
    user: users.sample
  )
end

puts "Done! Created:"
puts "  #{User.count} users"
puts "  #{Post.count} posts"
puts "  #{Comment.count} comments"
