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
class PlatformSettingSerializer < ActiveModel::Serializer
  attributes :id, :key, :value, :typed_value, :value_type, :description, :updated_at

  delegate :typed_value, to: :object

  def updated_at
    object.updated_at.iso8601
  end
end
