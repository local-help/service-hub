# frozen_string_literal: true

module Payments
  class InitiatePayment
    include Callable

    attr_reader :booking, :user, :method

    def initialize(booking:, user:, method: 'online')
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @user = user
      @method = method
    end

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
