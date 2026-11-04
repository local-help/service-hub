module Api
  module V1
    module Admin
      class SubcategoriesController < ApplicationController
        before_action :require_super_admin!

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
          subcategory.update!(active: false)
          render json: { success: true, message: 'Subcategory deactivated' }
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
