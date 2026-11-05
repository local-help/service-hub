module Api
  module V1
    module Admin
      class ServicesController < ApplicationController
        before_action :require_admin!

        def show
          service = Service.find(params[:id])
          render json: service, serializer: ServiceDetailSerializer
        end

        def create
          service = Service.new(service_params)
          if service.save
            render json: service, serializer: ServiceDetailSerializer, status: :created
          else
            render json: { error: service.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          service = Service.find(params[:id])
          if service.update(service_params)
            render json: service, serializer: ServiceDetailSerializer
          else
            render json: { error: service.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          service = Service.find(params[:id])
          if service.bookings.exists? || service.service_requests.exists?
            service.update!(active: false)
            render json: { success: true, message: 'Service has associated bookings so it was deactivated instead of deleted.', deactivated: true }
          else
            service.destroy!
            render json: { success: true, message: 'Service deleted successfully' }
          end
        rescue ActiveRecord::DeleteRestrictionError
          service.update!(active: false)
          render json: { success: true, message: 'Service was deactivated due to existing records.', deactivated: true }
        end

        private

        def service_params
          params.permit(:category_id, :subcategory_id, :name, :slug, :description, :short_description,
                        :pricing_type, :booking_type, :fixed_price, :image_url, :position, :sort_order,
                        :active, :coming_soon, :estimated_duration_minutes, supported_vehicle_types: [])
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
