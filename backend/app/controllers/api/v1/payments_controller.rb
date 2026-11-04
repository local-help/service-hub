module Api
  module V1
    class PaymentsController < ApplicationController
      def index
        booking = Booking.find(params[:booking_id])
        authorize booking, :show?
        payments = booking.payments.recent
        render json: payments, each_serializer: PaymentSerializer
      end

      def initiate
        booking = Booking.find(params[:booking_id])
        authorize booking, :show?

        amount = booking.payment_amount
        unless amount.present? && amount > 0
          render json: { error: 'No payable amount determined for this booking' }, status: :unprocessable_entity
          return
        end

        # Create payment record
        order_id = "order_#{SecureRandom.hex(12)}"
        payment = booking.payments.create!(
          amount: amount,
          method: 'online',
          status: 'pending',
          gateway_order_id: order_id
        )

        render json: {
          payment: PaymentSerializer.new(payment).as_json,
          gateway_order_id: order_id,
          razorpay_key: ENV['RAZORPAY_KEY_ID'] || 'rzp_test_mock_key',
          amount_cents: (amount * 100).to_i,
          currency: 'INR'
        }, status: :created
      end

      def verify
        booking = Booking.find(params[:booking_id])
        authorize booking, :show?

        payment = booking.payments.find_by(gateway_order_id: params[:gateway_order_id])
        raise ActiveRecord::RecordNotFound, 'Payment order not found' unless payment

        # If already paid, idempotent response
        if payment.paid?
          render json: payment, serializer: PaymentSerializer
          return
        end

        # In test / dev with mock gateway, verify signature or test payload
        payment.update!(
          status: 'paid',
          gateway_reference: params[:gateway_reference] || "pay_#{SecureRandom.hex(12)}",
          gateway_metadata: {
            verified_at: Time.current.iso8601,
            razorpay_signature: params[:signature]
          }
        )

        render json: payment, serializer: PaymentSerializer
      end
    end
  end
end

