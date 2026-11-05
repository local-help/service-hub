# == Schema Information
#
# Table name: bookings
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text
#  duration_hours      :integer
#  feedback            :text
#  preferred_at        :datetime
#  rating              :integer
#  reference_number    :string
#  scheduled_at        :datetime
#  selected_options    :jsonb
#  status              :string           default("confirmed"), not null
#  total_amount        :decimal(10, 2)
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint
#  provider_id         :bigint
#  quotation_id        :bigint
#  service_id          :bigint
#  service_request_id  :bigint
#  service_variant_id  :bigint
#  user_id             :bigint
#
# Indexes
#
#  index_bookings_on_address_id          (address_id)
#  index_bookings_on_provider_id         (provider_id)
#  index_bookings_on_quotation_id        (quotation_id)
#  index_bookings_on_reference_number    (reference_number) UNIQUE
#  index_bookings_on_scheduled_at        (scheduled_at)
#  index_bookings_on_service_id          (service_id)
#  index_bookings_on_service_request_id  (service_request_id) UNIQUE
#  index_bookings_on_service_variant_id  (service_variant_id)
#  index_bookings_on_status              (status)
#  index_bookings_on_user_id             (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (quotation_id => quotations.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
class BookingSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :scheduled_at, :preferred_at,
             :description, :booking_type, :vehicle_type, :duration_hours,
             :total_paid, :payment_amount, :fully_paid, :rating, :feedback,
             :service_id, :service_name, :service_category, :service_image_url,
             :pricing_type, :fixed_price,
             :customer_name, :customer_phone,
             :provider_id, :provider_name,
             :has_quotation, :quotation_status, :quotation_amount,
             :created_at

  def reference_number
    object.reference_number || object.service_request&.reference_number
  end

  def total_paid
    object.total_paid.to_f
  end

  def payment_amount
    object.payment_amount&.to_f
  end

  def fully_paid
    object.fully_paid?
  end

  def service_id
    object.service_id || object.service_request&.service_id
  end

  def service_name
    object.service&.name || object.service_request&.service&.name
  end

  def service_category
    object.service&.category&.name || object.service_request&.service&.category&.name
  end

  def service_image_url
    object.service&.image_url || object.service_request&.service&.image_url
  end

  def pricing_type
    object.service&.pricing_type || object.service_request&.service&.pricing_type || 'fixed_price'
  end

  def fixed_price
    object.service&.fixed_price || object.service_request&.service&.fixed_price
  end

  def customer_name
    object.user&.name || object.service_request&.user&.name
  end

  def customer_phone
    object.user&.phone || object.service_request&.user&.phone
  end

  def provider_name
    object.provider&.name || object.service_request&.provider&.name
  end

  def has_quotation
    object.active_quotation.present?
  end

  def quotation_status
    object.active_quotation&.status
  end

  def quotation_amount
    object.active_quotation&.amount&.to_f
  end

  def scheduled_at
    object.scheduled_at&.iso8601
  end

  def preferred_at
    object.preferred_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
