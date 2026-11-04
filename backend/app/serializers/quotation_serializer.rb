class QuotationSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :amount, :description, :status,
             :valid_until, :created_by, :is_expired, :created_at

  def amount
    object.amount.to_f
  end

  def is_expired
    object.expired?
  end

  def valid_until
    object.valid_until.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end

