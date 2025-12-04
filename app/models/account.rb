class Account < ApplicationRecord
  include Joinable

  has_one_attached :logo

  # Settings with defaults
  class Settings
    DEFAULTS = { restrict_room_creation_to_administrators: false }.freeze

    def initialize(data = {})
      @data = DEFAULTS.merge((data || {}).symbolize_keys)
    end

    def restrict_room_creation_to_administrators
      @data[:restrict_room_creation_to_administrators]
    end

    def restrict_room_creation_to_administrators=(value)
      @data[:restrict_room_creation_to_administrators] = ActiveModel::Type::Boolean.new.cast(value)
    end

    def to_h
      @data
    end
  end

  def settings
    @settings ||= Settings.new(super)
  end

  def settings=(value)
    value = value.to_h if value.is_a?(Settings)
    value = value.transform_values { |v| ActiveModel::Type::Boolean.new.cast(v) if v.is_a?(String) && %w[true false 0 1].include?(v) } if value.is_a?(Hash)
    super(value)
    @settings = nil
  end
end
