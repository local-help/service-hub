# frozen_string_literal: true

module Payments
  class VerifyPayment
    include Callable

    attr_reader :booking, :gateway_order_id, :gateway_reference, :signature

    def initialize(booking:, gateway_order_id:, gateway_reference: nil, signature: nil)
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @gateway_order_id = gateway_order_id
      @gateway_reference = gateway_reference
      @signature = signature
    end

    def call
      payment = booking.payments.find_by(gateway_order_id: gateway_order_id)
      raise ActiveRecord::RecordNotFound, 'Payment order not found' unless payment

      # Idempotent response if already marked paid
      return payment if payment.paid?

      ActiveRecord::Base.transaction do
        payment.update!(
          status: 'paid',
          gateway_reference: gateway_reference || "pay_#{SecureRandom.hex(12)}",
          gateway_metadata: {
            verified_at: Time.current.iso8601,
            razorpay_signature: signature
          }
        )
      end

      NotificationService.create_notification(
        user: booking.user,
        type: 'payment_received',
        title: "Payment Received: ₹#{payment.amount.to_f}",
        body: "Payment of ₹#{payment.amount.to_f} for booking #{booking.reference_number} was successfully completed.",
        metadata: {
          booking_id: booking.id,
          payment_id: payment.id,
          reference_number: booking.reference_number,
          action_url: '/bookings'
        }
      )

      payment
    end
  end
end
