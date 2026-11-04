class BookingSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :quotation_id, :scheduled_at,
             :status, :rating, :total_paid, :payment_amount, :fully_paid,
             :service_name, :reference_number, :created_at

  def total_paid
    object.total_paid.to_f
  end

  def payment_amount
    object.payment_amount&.to_f
  end

  def fully_paid
    object.fully_paid?
  end

  def service_name
    object.service_request.service.name
  end

  def reference_number
    object.service_request.reference_number
  end

  def scheduled_at
    object.scheduled_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end

