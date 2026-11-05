module Api
  module V1
    class ServiceRequestsController < ApplicationController
      def index
        requests = policy_scope(ServiceRequest).includes(:service, :user, :provider, :quotation, :booking, service: :category).recent
        requests = requests.by_status(params[:status]) if params[:status].present?
        requests = paginate(requests)
        render json: requests, each_serializer: ServiceRequestSerializer, meta: pagination_meta(requests)
      end

      def show
        service_request = ServiceRequest.find(params[:id])
        authorize service_request
        render json: service_request, serializer: ServiceRequestDetailSerializer
      end

      def create
        s_id = params[:service_id] || params.dig(:service_request, :service_id)
        a_id = params[:address_id] || params.dig(:service_request, :address_id)
        desc = params[:description] || params.dig(:service_request, :description)
        pref = params[:preferred_at] || params.dig(:service_request, :preferred_at) || params[:preferred_date] || params.dig(:service_request, :preferred_date)
        v_id = params[:service_variant_id] || params.dig(:service_request, :service_variant_id)
        v_type = params[:vehicle_type] || params.dig(:service_request, :vehicle_type)
        dur = params[:duration_hours] || params.dig(:service_request, :duration_hours)
        opts = params[:selected_options] || params.dig(:service_request, :selected_options) || {}

        service = Service.active.find(s_id)
        if service.coming_soon?
          skip_authorization
          render json: { error: 'This service is coming soon and cannot be booked yet.' }, status: :unprocessable_entity
          return
        end

        address = current_user.addresses.find(a_id)
        variant = v_id.present? ? service.variants.find_by(id: v_id) : nil

        service_request = current_user.service_requests.build(
          service: service,
          service_variant: variant,
          address: address,
          description: desc,
          preferred_at: pref,
          booking_type: service.booking_type,
          vehicle_type: v_type,
          duration_hours: dur,
          selected_options: opts
        )
        authorize service_request

        ActiveRecord::Base.transaction do
          service_request.save!

          # Handle optional attachments (URLs or uploaded files)
          if params[:attachments].is_a?(Array)
            params[:attachments].each do |att|
              service_request.request_attachments.create!(
                file_url: att[:file_url] || att,
                file_name: att[:file_name],
                content_type: att[:content_type],
                file_size: att[:file_size]
              )
            end
          end

          # Synchronize unified booking record
          booking = service_request.create_booking!(
            user: current_user,
            service: service,
            service_variant: service_request.service_variant,
            address: address,
            reference_number: service_request.reference_number,
            description: service_request.description,
            preferred_at: service_request.preferred_at,
            scheduled_at: service_request.preferred_at || 1.day.from_now,
            booking_type: service.booking_type,
            vehicle_type: service_request.vehicle_type,
            duration_hours: service_request.duration_hours,
            selected_options: service_request.selected_options,
            status: service.fixed_price? ? 'confirmed' : 'pending_review'
          )
          service_request.update!(status: 'booking_confirmed') if service.fixed_price?

          # Link attachments to booking as well
          service_request.request_attachments.update_all(booking_id: booking.id)

          StatusHistory.create!(
            entity_type: 'ServiceRequest',
            entity_id: service_request.id,
            previous_status: nil,
            new_status: service_request.status,
            changed_by: current_user.id,
            notes: 'Service request submitted by customer'
          )
        end

        render json: service_request, serializer: ServiceRequestDetailSerializer, status: :created
      end

      def cancel
        service_request = ServiceRequest.find(params[:id])
        authorize service_request

        if %w[completed cancelled].include?(service_request.status)
          render json: { error: "Cannot cancel request in #{service_request.status} status" }, status: :unprocessable_entity
          return
        end

        service_request.transition_to!('cancelled', changed_by: current_user, notes: params[:reason] || 'Cancelled by customer')
        service_request.update!(cancellation_reason: params[:reason])

        if service_request.booking&.can_cancel?
          service_request.booking.transition_to!('cancelled', changed_by: current_user, notes: 'Cancelled due to service request cancellation')
        end

        render json: service_request, serializer: ServiceRequestDetailSerializer
      end

      private

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

