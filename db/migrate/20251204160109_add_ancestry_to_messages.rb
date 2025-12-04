class AddAncestryToMessages < ActiveRecord::Migration[8.2]
  def change
    add_column :messages, :ancestry, :string
    add_index :messages, :ancestry
  end
end
