# == Schema Information
#
# Table name: payments
#
#  id                :bigint           not null, primary key
#  amount            :decimal(10, 2)   not null
#  gateway_metadata  :jsonb
#  gateway_reference :string
#  method            :string           not null
#  recorded_by       :bigint
#  status            :string           default("pending"), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  booking_id        :bigint           not null
#  gateway_order_id  :string
#
# Indexes
#
#  index_payments_on_booking_id         (booking_id)
#  index_payments_on_gateway_order_id   (gateway_order_id) UNIQUE WHERE (gateway_order_id IS NOT NULL)
#  index_payments_on_gateway_reference  (gateway_reference) UNIQUE WHERE (gateway_reference IS NOT NULL)
#  index_payments_on_status             (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (recorded_by => users.id)
#
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
