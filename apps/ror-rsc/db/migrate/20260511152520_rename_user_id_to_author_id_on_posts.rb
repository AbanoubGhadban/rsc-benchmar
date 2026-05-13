class RenameUserIdToAuthorIdOnPosts < ActiveRecord::Migration[7.2]
  def change
    rename_column :posts, :user_id, :author_id
  end
end
