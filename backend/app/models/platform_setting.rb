# == Schema Information
#
# Table name: platform_settings
#
#  id          :bigint           not null, primary key
#  description :text
#  key         :string           not null
#  value       :text
#  value_type  :string           default("string"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_platform_settings_on_key  (key) UNIQUE
#
class PlatformSetting < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :value_type, presence: true, inclusion: { in: %w[string integer boolean json] }

  scope :by_key, ->(key) { find_by(key: key) }

  def typed_value
    case value_type
    when 'integer'
      value.to_i
    when 'boolean'
      ActiveModel::Type::Boolean.new.cast(value)
    when 'json'
      JSON.parse(value) rescue {}
    else
      value
    end
  end

  def self.get(key, default: nil)
    setting = find_by(key: key)
    setting ? setting.typed_value : default
  end

  def self.set(key, value, value_type: 'string', description: nil)
    setting = find_or_initialize_by(key: key)
    setting.update!(value: value.to_s, value_type: value_type, description: description)
    setting
  end
end
