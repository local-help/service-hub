module Api
  module V1
    module Admin
      class ServiceVariantsController < ApplicationController
        before_action :require_super_admin!

        def create
          service = Service.find(params[:service_id])
          variant = service.variants.build(variant_params)
          if variant.save
            # If initial price passed, create pricing record
            if params[:price].present?
              variant.service_pricings.create!(
                price: params[:price],
                pricing_type: params[:pricing_type] || 'fixed',
                applicable_conditions: params[:applicable_conditions] || {},
                active: true
              )
            end
            render json: variant, serializer: ServiceVariantSerializer, status: :created
          else
            render json: { error: variant.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          variant = ServiceVariant.find(params[:id])
          if variant.update(variant_params)
            if params[:price].present?
              pricing = variant.service_pricings.find_or_initialize_by(active: true)
              pricing.update!(
                price: params[:price],
                pricing_type: params[:pricing_type] || pricing.pricing_type || 'fixed',
                applicable_conditions: params[:applicable_conditions] || pricing.applicable_conditions || {}
              )
            end
            render json: variant, serializer: ServiceVariantSerializer
          else
            render json: { error: variant.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          variant = ServiceVariant.find(params[:id])
          variant.update!(active: false)
          render json: { success: true, message: 'Variant deactivated' }
        end

        private

        def variant_params
          params.permit(:name, :description, :position, :active, variant_attributes: {})
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
