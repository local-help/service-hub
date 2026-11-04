module Api
  module V1
    module Admin
      class ServicesController < ApplicationController
        before_action :require_super_admin!

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

        private

        def service_params
          params.permit(:category_id, :name, :description, :short_description,
                        :pricing_type, :fixed_price, :image_url, :sort_order,
                        :active, :estimated_duration_minutes)
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end

