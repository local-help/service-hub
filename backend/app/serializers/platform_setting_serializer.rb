class PlatformSettingSerializer < ActiveModel::Serializer
  attributes :id, :key, :value, :typed_value, :value_type, :description, :updated_at

  def typed_value
    object.typed_value
  end

  def updated_at
    object.updated_at.iso8601
  end
end

