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
