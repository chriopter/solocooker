require "test_helper"

class ActionTextAttachablesTest < ActiveSupport::TestCase
  test "decodes rails 8 style sgid" do
    user = users(:david)
    sgid = user.to_sgid.to_s

    # Verify the attachment can be resolved from the sgid
    node = Nokogiri::HTML::DocumentFragment.parse(
      "<action-text-attachment sgid=\"#{sgid}\"></action-text-attachment>"
    ).children.first

    attachment = ActionText::Attachment.from_node(node)
    assert_equal user, attachment.attachable
  end
end
