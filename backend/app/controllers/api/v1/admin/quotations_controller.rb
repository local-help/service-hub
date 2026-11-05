# frozen_string_literal: true

module Api
  module V1
    module Admin
      class QuotationsController < ApplicationController
        before_action :require_admin!

        def create
          quotation = Quotations::CreateQuotation.call(
            created_by: current_user,
            params: params
          )

          render json: quotation, serializer: QuotationSerializer, status: :created
        end

        def update
          quotation = Quotations::UpdateQuotation.call(
            quotation: params[:id],
            user: current_user,
            params: params
          )

          render json: quotation, serializer: QuotationSerializer
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end
