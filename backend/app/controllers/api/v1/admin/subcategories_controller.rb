module Api
  module V1
    module Admin
      class SubcategoriesController < ApplicationController
        before_action :require_admin!

        def create
          subcategory = Subcategory.new(subcategory_params)
          if subcategory.save
            render json: subcategory, serializer: SubcategorySerializer, status: :created
          else
            render json: { error: subcategory.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          subcategory = Subcategory.find(params[:id])
          if subcategory.update(subcategory_params)
            render json: subcategory, serializer: SubcategorySerializer
          else
            render json: { error: subcategory.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          subcategory = Subcategory.find(params[:id])
          if subcategory.services.joins(:bookings).exists?
            subcategory.update!(active: false)
            render json: { success: true, message: 'Subcategory has services with bookings so it was deactivated.', deactivated: true }
          else
            subcategory.destroy!
            render json: { success: true, message: 'Subcategory deleted successfully' }
          end
        rescue ActiveRecord::DeleteRestrictionError
          subcategory.update!(active: false)
          render json: { success: true, message: 'Subcategory was deactivated.', deactivated: true }
        end

        private

        def subcategory_params
          params.permit(:category_id, :name, :slug, :description, :position, :active)
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
