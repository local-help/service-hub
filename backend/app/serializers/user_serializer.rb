class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :phone, :role, :status,
             :phone_verified, :email_verified, :avatar_url,
             :created_at

  def created_at
    object.created_at&.iso8601
  end
end

