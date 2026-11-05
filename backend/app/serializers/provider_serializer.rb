# == Schema Information
#
# Table name: providers
#
#  id                  :bigint           not null, primary key
#  active              :boolean          default(TRUE)
#  address             :text
#  approved_at         :datetime
#  business_address    :text
#  city                :string
#  contact_email       :string
#  contact_person      :string
#  contact_phone       :string
#  email               :string
#  name                :string           not null
#  notes               :text
#  onboarding_status   :string           default("completed"), not null
#  operational_status  :string           default("active"), not null
#  phone               :string           not null
#  postal_code         :string           default("211001")
#  service_area        :string
#  slug                :string
#  state               :string           default("Uttar Pradesh")
#  suspended_at        :datetime
#  suspension_reason   :text
#  verification_status :string           default("verified"), not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  approved_by_id      :bigint
#
# Indexes
#
#  index_providers_on_active               (active)
#  index_providers_on_city                 (city)
#  index_providers_on_operational_status   (operational_status)
#  index_providers_on_phone                (phone)
#  index_providers_on_slug                 (slug) UNIQUE
#  index_providers_on_verification_status  (verification_status)
#
# Foreign Keys
#
#  fk_rails_...  (approved_by_id => users.id)
#
class ProviderSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :phone, :email,
             :contact_person, :contact_phone, :contact_email,
             :address, :business_address, :city, :state, :postal_code,
             :service_area, :notes, :active,
             :verification_status, :operational_status, :onboarding_status,
             :approved_at, :suspended_at, :suspension_reason,
             :created_at

  has_one :availability, serializer: ProviderAvailabilitySerializer
  has_many :services, serializer: ServiceSerializer

  def name
    object.name.presence || object.business_name
  end

  def business_address
    object.business_address.presence || object.address
  end

  def contact_phone
    object.contact_phone.presence || object.phone
  end

  def contact_email
    object.contact_email.presence || object.email
  end

  def created_at
    object.created_at&.iso8601
  end

  def approved_at
    object.approved_at&.iso8601
  end

  def suspended_at
    object.suspended_at&.iso8601
  end
end
