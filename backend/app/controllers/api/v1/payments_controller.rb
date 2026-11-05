# frozen_string_literal: true

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

        result = Payments::InitiatePayment.call(
          booking: booking,
          user: current_user,
          method: 'online'
        )

        render json: {
          payment: PaymentSerializer.new(result[:payment]).as_json,
          gateway_order_id: result[:gateway_order_id],
          razorpay_key: result[:razorpay_key],
          amount_cents: result[:amount_cents],
          currency: result[:currency]
        }, status: :created
      end

      def verify
        booking = Booking.find(params[:booking_id])
        authorize booking, :show?

        payment = Payments::VerifyPayment.call(
          booking: booking,
          gateway_order_id: params[:gateway_order_id],
          gateway_reference: params[:gateway_reference],
          signature: params[:signature]
        )

        render json: payment, serializer: PaymentSerializer
      end
    end
  end
end
