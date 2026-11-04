class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :phone, :role, :status,
             :phone_verified, :email_verified, :avatar_url,
             :provider_id, :provider_name, :provider_role,
             :created_at

  def provider_id
    object.service_provider&.id
  end

  def provider_name
    object.service_provider&.name
  end

  def provider_role
    object.provider_role
  end

  def created_at
    object.created_at&.iso8601
  end
end
