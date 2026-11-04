module Api
  module V1
    module Admin
      class QuotationsController < ApplicationController
        before_action :require_admin!

        def create
          service_request = ServiceRequest.find(params[:service_request_id])

          if service_request.quotation.present?
            render json: { error: 'A quotation already exists for this service request' }, status: :unprocessable_entity
            return
          end

          quotation = service_request.build_quotation(
            amount: params[:amount],
            description: params[:description],
            valid_until: params[:valid_until] || 3.days.from_now,
            created_by: current_user.id,
            status: 'pending'
          )

          ActiveRecord::Base.transaction do
            quotation.save!

            if service_request.can_transition_to?('quotation_sent')
              service_request.transition_to!(
                'quotation_sent',
                changed_by: current_user,
                notes: "Quotation created for #{quotation.amount}"
              )
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'create_quotation',
              entity: quotation,
              metadata: { amount: quotation.amount.to_f, service_request_id: service_request.id }
            )
          end

          render json: quotation, serializer: QuotationSerializer, status: :created
        end

        def update
          quotation = Quotation.find(params[:id])

          unless quotation.can_modify?
            render json: { error: "Cannot modify quotation with status #{quotation.status}" }, status: :unprocessable_entity
            return
          end

          ActiveRecord::Base.transaction do
            quotation.update!(quotation_update_params)

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_quotation',
              entity: quotation,
              metadata: { amount: quotation.amount.to_f }
            )
          end

          render json: quotation, serializer: QuotationSerializer
        end

        private

        def quotation_update_params
          params.permit(:amount, :description, :valid_until)
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end

