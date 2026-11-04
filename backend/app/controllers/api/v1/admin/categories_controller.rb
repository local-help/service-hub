module Api
  module V1
    module Admin
      class CategoriesController < ApplicationController
        before_action :require_super_admin!

        def create
          category = Category.new(category_params)
          if category.save
            render json: category, serializer: CategoryDetailSerializer, status: :created
          else
            render json: { error: category.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          category = Category.find(params[:id])
          if category.update(category_params)
            render json: category, serializer: CategoryDetailSerializer
          else
            render json: { error: category.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        private

        def category_params
          params.permit(:name, :description, :image_url, :icon_name, :sort_order, :active)
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end

