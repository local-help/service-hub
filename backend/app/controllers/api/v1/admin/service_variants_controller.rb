module Api
  module V1
    module Admin
      class ServiceVariantsController < ApplicationController
        before_action :require_admin!

        def create
          service = Service.find(params[:service_id])
          variant = service.variants.build(variant_params)
          if variant.save
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
              pricing.pricing_type ||= params[:pricing_type] || 'fixed'
              pricing.applicable_conditions ||= params[:applicable_conditions] || {}
              pricing.price = params[:price]
              pricing.save!
            end
            render json: variant, serializer: ServiceVariantSerializer
          else
            render json: { error: variant.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          variant = ServiceVariant.find(params[:id])
          if variant.service_requests.exists?
            variant.update!(active: false)
            render json: { success: true, message: 'Package variant has associated requests so it was deactivated.', deactivated: true }
          else
            variant.destroy!
            render json: { success: true, message: 'Package variant deleted successfully' }
          end
        rescue ActiveRecord::DeleteRestrictionError
          variant.update!(active: false)
          render json: { success: true, message: 'Package variant was deactivated.', deactivated: true }
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
