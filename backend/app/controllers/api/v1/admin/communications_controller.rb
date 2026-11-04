module Api
  module V1
    module Admin
      class CommunicationsController < ApplicationController
        before_action :require_admin!

        def index
          service_request = ServiceRequest.find(params[:service_request_id])
          communications = service_request.communications.recent
          render json: communications, each_serializer: CommunicationSerializer
        end

        def create
          service_request = ServiceRequest.find(params[:service_request_id])

          communication = service_request.communications.build(
            admin_user: current_user,
            channel: params[:channel],
            direction: params[:direction],
            summary: params[:summary],
            outcome: params[:outcome],
            communicated_at: params[:communicated_at] || Time.current
          )

          ActiveRecord::Base.transaction do
            communication.save!

            AdminActivityLog.log!(
              admin: current_user,
              action: 'record_communication',
              entity: communication,
              metadata: {
                service_request_id: service_request.id,
                channel: communication.channel,
                direction: communication.direction
              }
            )
          end

          render json: communication, serializer: CommunicationSerializer, status: :created
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end

