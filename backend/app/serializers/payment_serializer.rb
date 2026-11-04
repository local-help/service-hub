class PaymentSerializer < ActiveModel::Serializer
  attributes :id, :booking_id, :amount, :method, :status,
             :gateway_reference, :gateway_order_id, :recorded_by,
             :created_at

  def method
    object.read_attribute(:method)
  end

  def amount
    object.amount.to_f
  end

  def created_at
    object.created_at.iso8601
  end
end
