module Api
  module V1
    class QuotationsController < ApplicationController
      def show
        service_request = ServiceRequest.find(params[:service_request_id])
        quotation = service_request.quotation
        raise ActiveRecord::RecordNotFound, 'Quotation not found for this request' unless quotation

        authorize quotation
        render json: quotation, serializer: QuotationSerializer
      end

      def approve
        service_request = ServiceRequest.find(params[:service_request_id])
        quotation = service_request.quotation
        raise ActiveRecord::RecordNotFound, 'Quotation not found for this request' unless quotation

        authorize quotation

        unless quotation.can_approve?
          render json: { error: 'Quotation cannot be approved (already resolved or expired)' }, status: :unprocessable_entity
          return
        end

        ActiveRecord::Base.transaction do
          quotation.approve!(changed_by: current_user)

          # Auto-create or confirm booking
          booking = service_request.booking || service_request.build_booking
          booking.quotation = quotation
          booking.scheduled_at = service_request.preferred_at || 1.day.from_now
          booking.status = 'confirmed'
          booking.save!

          service_request.transition_to!('booking_confirmed', changed_by: current_user, notes: 'Booking confirmed upon quotation approval')
        end

        render json: {
          message: 'Quotation approved and booking confirmed',
          quotation: QuotationSerializer.new(quotation).as_json,
          booking: BookingSerializer.new(service_request.booking).as_json
        }
      end

      def reject
        service_request = ServiceRequest.find(params[:service_request_id])
        quotation = service_request.quotation
        raise ActiveRecord::RecordNotFound, 'Quotation not found for this request' unless quotation

        authorize quotation

        unless quotation.can_reject?
          render json: { error: 'Quotation cannot be rejected (already resolved)' }, status: :unprocessable_entity
          return
        end

        quotation.reject!(changed_by: current_user)

        render json: {
          message: 'Quotation rejected',
          quotation: QuotationSerializer.new(quotation).as_json
        }
      end
    end
  end
end

