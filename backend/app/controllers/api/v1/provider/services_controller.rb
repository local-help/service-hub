module Api
  module V1
    module Provider
      class ServicesController < BaseController
        before_action :require_manager!, only: [:update]

        def index
          provider_services = current_provider.provider_services.includes(service: [:category, :service_variants])

          render json: provider_services.map { |ps|
            {
              id: ps.id,
              service_id: ps.service_id,
              service_name: ps.service.name,
              category_name: ps.service.category.name,
              pricing_type: ps.service.pricing_type,
              base_price: ps.service.fixed_price&.to_f,
              active: ps.active,
              provider_specific_pricing: ps.provider_specific_pricing || {},
              variants: ps.service.service_variants.map { |v|
                {
                  id: v.id,
                  name: v.name,
                  vehicle_type: v.vehicle_type,
                  price: ps.custom_price_for(variant_id: v.id) || v.price&.to_f
                }
              }
            }
          }
        end

        def update
          provider_service = current_provider.provider_services.find(params[:id])

          updates = {}
          updates[:active] = params[:active] if params.key?(:active)
          updates[:provider_specific_pricing] = params[:provider_specific_pricing] if params.key?(:provider_specific_pricing)

          provider_service.update!(updates)

          render json: {
            id: provider_service.id,
            service_id: provider_service.service_id,
            active: provider_service.active,
            provider_specific_pricing: provider_service.provider_specific_pricing
          }
        end
      end
    end
  end
end

