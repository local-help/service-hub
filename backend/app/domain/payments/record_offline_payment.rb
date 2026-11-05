# frozen_string_literal: true

module Payments
  class RecordOfflinePayment
    include Callable

    attr_reader :booking, :recorded_by, :params

    def initialize(booking:, recorded_by:, params:)
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @recorded_by = recorded_by
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      amount = (params[:amount] || booking.payment_amount).to_f
      raise DomainError, 'Payment amount must be greater than zero' unless amount > 0

      payment = nil
      ActiveRecord::Base.transaction do
        payment = booking.payments.create!(
          amount: amount,
          method: 'offline',
          status: 'paid',
          recorded_by: recorded_by.id,
          gateway_metadata: {
            notes: params[:notes],
            payment_type: params[:offline_type] || 'cash',
            reference: params[:reference]
          }
        )

        AdminActivityLog.log!(
          admin: recorded_by,
          action: 'record_offline_payment',
          entity: payment,
          metadata: {
            booking_id: booking.id,
            amount: payment.amount.to_f
          }
        )
      end

      NotificationService.create_notification(
        user: booking.user,
        type: 'payment_received',
        title: "Payment Receipt: ₹#{payment.amount.to_f}",
        body: "Offline payment of ₹#{payment.amount.to_f} for booking #{booking.reference_number} has been recorded.",
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
