# == Schema Information
#
# Table name: users
#
#  id              :bigint           not null, primary key
#  avatar_url      :string
#  email           :string
#  email_verified  :boolean          default(FALSE)
#  google_uid      :string
#  name            :string           not null
#  password_digest :string
#  phone           :string
#  phone_verified  :boolean          default(FALSE)
#  role            :string           default("customer"), not null
#  status          :string           default("active"), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_users_on_email       (email) UNIQUE WHERE (email IS NOT NULL)
#  index_users_on_google_uid  (google_uid) UNIQUE WHERE (google_uid IS NOT NULL)
#  index_users_on_phone       (phone) UNIQUE WHERE (phone IS NOT NULL)
#  index_users_on_role        (role)
#  index_users_on_status      (status)
#
class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :phone, :role, :status,
             :phone_verified, :email_verified, :avatar_url,
             :provider_id, :provider_name, :provider_role,
             :has_password, :google_linked,
             :created_at

  def google_linked
    object.google_uid.present?
  end

  def has_password
    object.password_digest.present?
  end

  def provider_id
    object.service_provider&.id
  end

  def provider_name
    object.service_provider&.name
  end

  delegate :provider_role, to: :object

  def created_at
    object.created_at&.iso8601
  end
end
