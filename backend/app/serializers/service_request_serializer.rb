# == Schema Information
#
# Table name: service_requests
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text             not null
#  duration_hours      :integer
#  preferred_at        :datetime
#  reference_number    :string           not null
#  selected_options    :jsonb
#  status              :string           default("pending_review"), not null
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint           not null
#  provider_id         :bigint
#  service_id          :bigint           not null
#  service_variant_id  :bigint
#  user_id             :bigint           not null
#
# Indexes
#
#  index_service_requests_on_address_id          (address_id)
#  index_service_requests_on_preferred_at        (preferred_at)
#  index_service_requests_on_provider_id         (provider_id)
#  index_service_requests_on_reference_number    (reference_number) UNIQUE
#  index_service_requests_on_service_id          (service_id)
#  index_service_requests_on_service_variant_id  (service_variant_id)
#  index_service_requests_on_status              (status)
#  index_service_requests_on_user_id             (user_id)
#  index_service_requests_on_user_id_and_status  (user_id,status)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (assigned_by => users.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
class ServiceRequestSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :description, :preferred_at,
             :user_id, :customer_name, :customer_phone,
             :service_id, :service_name, :service_category, :pricing_type, :fixed_price,
             :provider_id, :provider_name,
             :has_quotation, :quotation_status, :quotation_amount,
             :has_booking, :booking_status, :booking_id,
             :created_at

  def booking_id
    object.booking&.id
  end

  def customer_name
    object.user.name
  end

  def customer_phone
    object.user.phone
  end

  def service_name
    object.service.name
  end

  def service_category
    object.service.category.name
  end

  def pricing_type
    object.service.pricing_type
  end

  def fixed_price
    object.service.fixed_price&.to_f
  end

  def provider_name
    object.provider&.name
  end

  def has_quotation
    object.quotation.present?
  end

  def quotation_status
    object.quotation&.status
  end

  def quotation_amount
    object.quotation&.amount&.to_f
  end

  def has_booking
    object.booking.present?
  end

  def booking_status
    object.booking&.status
  end

  def preferred_at
    object.preferred_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
