class BookingDetailSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :quotation_id, :scheduled_at,
             :status, :cancellation_reason, :admin_notes, :rating, :feedback,
             :total_paid, :payment_amount, :fully_paid, :created_at

  belongs_to :service_request, serializer: ServiceRequestSerializer
  belongs_to :quotation, serializer: QuotationSerializer
  has_many :payments, serializer: PaymentSerializer

  def total_paid
    object.total_paid.to_f
  end

  def payment_amount
    object.payment_amount&.to_f
  end

  def fully_paid
    object.fully_paid?
  end

  def scheduled_at
    object.scheduled_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end

