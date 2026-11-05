# frozen_string_literal: true

module Payments
  class RecordOfflinePayment
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :recorded_by, type: Types.Instance(User)
    option :params

    def call
      parsed_params = normalize_params(params)
      amount = (parsed_params[:amount] || booking.payment_amount).to_f
      raise DomainError, 'Payment amount must be greater than zero' unless amount > 0

      payment = nil
      ActiveRecord::Base.transaction do
        payment = booking.payments.create!(
          amount: amount,
          method: 'offline',
          status: 'paid',
          recorded_by: recorded_by.id,
          gateway_metadata: {
            notes: parsed_params[:notes],
            payment_type: parsed_params[:offline_type] || 'cash',
            reference: parsed_params[:reference]
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

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
