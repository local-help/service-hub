class ServiceRequestSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :description, :preferred_at,
             :user_id, :customer_name, :customer_phone,
             :service_id, :service_name, :service_category, :pricing_type, :fixed_price,
             :provider_id, :provider_name,
             :has_quotation, :quotation_status, :quotation_amount,
             :has_booking, :booking_status,
             :created_at

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

