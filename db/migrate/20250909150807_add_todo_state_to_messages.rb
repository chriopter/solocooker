class AddTodoStateToMessages < ActiveRecord::Migration[8.0]
  def change
    add_column :messages, :todo_state, :integer, default: nil
    add_index :messages, :todo_state
  end
end