module Api
  module V1
    module Admin
      class CommunicationsController < ApplicationController
        before_action :require_admin!

        def index
          scope = if params[:booking_id].present?
                    Booking.find(params[:booking_id]).communications
                  else
                    ServiceRequest.find(params[:service_request_id]).communications
                  end
          render json: scope.recent, each_serializer: CommunicationSerializer
        end

        def create
          booking = Booking.find_by(id: params[:booking_id]) if params[:booking_id].present?
          service_request = ServiceRequest.find_by(id: params[:service_request_id]) || booking&.service_request

          communication = Communication.new(
            admin_user: current_user,
            booking: booking,
            service_request: service_request,
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
                booking_id: booking&.id,
                service_request_id: service_request&.id,
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
