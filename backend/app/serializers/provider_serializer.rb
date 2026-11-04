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
