module Api
  module V1
    module Admin
      class PaymentsController < ApplicationController
        before_action :require_admin!

        def index
          payments = Payment.includes(booking: [service_request: :user]).recent
          payments = payments.by_status(params[:status]) if params[:status].present?
          payments = paginate(payments)
          render json: payments, each_serializer: PaymentSerializer, meta: pagination_meta(payments)
        end

        def record_offline
          booking = Booking.find(params[:booking_id])

          amount = params[:amount] || booking.payment_amount
          unless amount.to_f > 0
            render json: { error: 'Payment amount must be greater than zero' }, status: :unprocessable_entity
            return
          end

          payment = booking.payments.build(
            amount: amount,
            method: 'offline',
            status: 'paid',
            recorded_by: current_user.id,
            gateway_metadata: {
              notes: params[:notes],
              payment_type: params[:offline_type] || 'cash', # cash, pos, upi_direct
              reference: params[:reference]
            }
          )

          ActiveRecord::Base.transaction do
            payment.save!

            AdminActivityLog.log!(
              admin: current_user,
              action: 'record_offline_payment',
              entity: payment,
              metadata: {
                booking_id: booking.id,
                amount: payment.amount.to_f
              }
            )
          end

          render json: payment, serializer: PaymentSerializer, status: :created
        end

        private

        def skip_authorization?
          true
        end

        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count
          }
        end
      end
    end
  end
end

