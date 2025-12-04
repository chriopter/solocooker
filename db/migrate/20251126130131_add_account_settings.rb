class AddAccountSettings < ActiveRecord::Migration[8.0]
  def change
    add_column :accounts, :settings, :json
  end
end
