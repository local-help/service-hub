# frozen_string_literal: true

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

          payment = Payments::RecordOfflinePayment.call(
            booking: booking,
            recorded_by: current_user,
            params: params
          )

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
