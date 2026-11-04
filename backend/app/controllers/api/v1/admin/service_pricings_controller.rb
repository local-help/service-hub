module Api
  module V1
    module Admin
      class ServicePricingsController < ApplicationController
        before_action :require_super_admin!

        def create
          variant = ServiceVariant.find(params[:service_variant_id])
          pricing = variant.service_pricings.build(pricing_params)
          if pricing.save
            render json: pricing, serializer: ServicePricingSerializer, status: :created
          else
            render json: { error: pricing.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          pricing = ServicePricing.find(params[:id])
          if pricing.update(pricing_params)
            render json: pricing, serializer: ServicePricingSerializer
          else
            render json: { error: pricing.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          pricing = ServicePricing.find(params[:id])
          pricing.update!(active: false)
          render json: { success: true, message: 'Pricing deactivated' }
        end

        private

        def pricing_params
          params.permit(:price, :pricing_type, :active, applicable_conditions: {})
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end

