# frozen_string_literal: true

module Payments
  class InitiatePayment
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :user, type: Types.Instance(User)
    option :method, default: -> { 'online' }

    def call
      amount = booking.payment_amount
      raise DomainError, 'No payable amount determined for this booking' unless amount.present? && amount.to_f > 0

      order_id = "order_#{SecureRandom.hex(12)}"
      payment = booking.payments.create!(
        amount: amount,
        method: method,
        status: 'pending',
        gateway_order_id: order_id
      )

      {
        payment: payment,
        gateway_order_id: order_id,
        razorpay_key: ENV['RAZORPAY_KEY_ID'] || 'rzp_test_mock_key',
        amount_cents: (amount * 100).to_i,
        currency: 'INR'
      }
    end
  end
end
