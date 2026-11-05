# frozen_string_literal: true

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

        quotation = Quotations::ApproveQuotation.call(quotation, user: current_user)

        render json: {
          message: 'Quotation approved and booking confirmed',
          quotation: QuotationSerializer.new(quotation).as_json,
          booking: service_request.booking ? BookingSerializer.new(service_request.booking).as_json : nil
        }
      end

      def reject
        service_request = ServiceRequest.find(params[:service_request_id])
        quotation = service_request.quotation
        raise ActiveRecord::RecordNotFound, 'Quotation not found for this request' unless quotation

        authorize quotation

        quotation = Quotations::RejectQuotation.call(
          quotation,
          user: current_user,
          reason: params[:reason]
        )

        render json: {
          message: 'Quotation rejected',
          quotation: QuotationSerializer.new(quotation).as_json
        }
      end
    end
  end
end
