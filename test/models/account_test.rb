require "test_helper"

class AccountTest < ActiveSupport::TestCase
  test "default settings" do
    account = Account.new
    assert_equal false, account.settings.restrict_room_creation_to_administrators
  end

  test "can update settings" do
    account = accounts(:one)
    account.update!(settings: { restrict_room_creation_to_administrators: true })
    assert_equal true, account.reload.settings.restrict_room_creation_to_administrators
  end
end
