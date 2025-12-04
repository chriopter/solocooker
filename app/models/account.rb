class Account < ApplicationRecord
  include Joinable

  has_one_attached :logo

  # Settings with defaults (custom implementation since has_json not available)
  class Settings
    DEFAULTS = { restrict_room_creation_to_administrators: false }.freeze

    def initialize(account, data = {})
      @account = account
      @data = DEFAULTS.merge((data || {}).symbolize_keys)
    end

    def restrict_room_creation_to_administrators
      @data[:restrict_room_creation_to_administrators]
    end
    alias_method :restrict_room_creation_to_administrators?, :restrict_room_creation_to_administrators

    def restrict_room_creation_to_administrators=(value)
      @data[:restrict_room_creation_to_administrators] = ActiveModel::Type::Boolean.new.cast(value)
      sync_to_account!
    end

    def to_h
      @data.transform_keys(&:to_s)
    end

    private

    def sync_to_account!
      @account.write_attribute(:settings, to_h)
    end
  end

  def settings
    @settings ||= Settings.new(self, read_attribute(:settings))
  end

  def settings=(value)
    value = value.to_h if value.is_a?(Settings)
    value = value.transform_values { |v| ActiveModel::Type::Boolean.new.cast(v) if v.is_a?(String) && %w[true false 0 1].include?(v) } if value.is_a?(Hash)
    write_attribute(:settings, value)
    @settings = nil
  end
end
