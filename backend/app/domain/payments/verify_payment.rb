# frozen_string_literal: true

module Payments
  class VerifyPayment
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :gateway_order_id
    option :gateway_reference, optional: true
    option :signature, optional: true

    def call
      payment = booking.payments.find_by(gateway_order_id: gateway_order_id)
      raise ActiveRecord::RecordNotFound, 'Payment order not found' unless payment

      # Idempotent response if already marked paid
      return payment if payment.paid?

      effective_reference = gateway_reference.presence || "pay_#{SecureRandom.hex(12)}"
      verify_signature!(effective_reference)

      ActiveRecord::Base.transaction do
        payment.gateway_reference = effective_reference
        payment.gateway_metadata = (payment.gateway_metadata || {}).merge(
          'verified_at' => Time.current.iso8601,
          'razorpay_signature' => signature
        )

        if payment.may_mark_paid?
          payment.mark_paid!
        else
          payment.update!(status: 'paid')
        end
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

    private

    def verify_signature!(effective_reference)
      secret = ENV.fetch('RAZORPAY_KEY_SECRET', nil)

      if secret.present?
        raise DomainError, 'Payment signature is required for verification' if signature.blank?

        payload = "#{gateway_order_id}|#{effective_reference}"
        expected = OpenSSL::HMAC.hexdigest('sha256', secret, payload)
        raise DomainError, 'Invalid payment signature verification' unless ActiveSupport::SecurityUtils.secure_compare(expected, signature)
      elsif Rails.env.production?
        raise DomainError, 'Payment verification configuration error: RAZORPAY_KEY_SECRET missing'
      else
        Rails.logger.info("[Payments::VerifyPayment] Non-production signature bypass for #{gateway_order_id}")
      end
    end
  end
end
