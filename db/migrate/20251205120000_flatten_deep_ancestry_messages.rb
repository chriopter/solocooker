class FlattenDeepAncestryMessages < ActiveRecord::Migration[8.0]
  def up
    # Find all messages with ancestry depth > 1 (3+ levels deep)
    # Ancestry format: "parent_id/grandparent_id/..." - more than one "/" means too deep
    deep_messages = Message.where("ancestry LIKE '%/%'")

    deep_messages.find_each do |message|
      # Get the root ancestor (first ID in ancestry chain)
      root_id = message.ancestry.split("/").first
      # Set ancestry to just the root, making it a direct child (2 levels max)
      message.update_column(:ancestry, root_id)
    end

    puts "Flattened #{deep_messages.count} messages to max 2 levels deep"
  end

  def down
    # This migration cannot be reversed - we don't know the original ancestry
    raise ActiveRecord::IrreversibleMigration
  end
end
