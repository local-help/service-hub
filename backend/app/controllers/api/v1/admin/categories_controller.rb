module Api
  module V1
    module Admin
      class CategoriesController < ApplicationController
        before_action :require_admin!

        def index
          categories = Category.sorted.includes(:subcategories, :services)
          render json: categories, each_serializer: CategoryDetailSerializer
        end

        def show
          category = Category.find(params[:id])
          render json: category, serializer: CategoryDetailSerializer
        end

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

        def destroy
          category = Category.find(params[:id])
          if category.services.joins(:bookings).exists?
            category.update!(active: false)
            render json: { success: true, message: 'Category has bookings so it was deactivated.', deactivated: true }
          else
            category.destroy!
            render json: { success: true, message: 'Category deleted successfully' }
          end
        rescue ActiveRecord::DeleteRestrictionError
          category.update!(active: false)
          render json: { success: true, message: 'Category was deactivated due to existing records.', deactivated: true }
        end

        private

        def category_params
          params.permit(:name, :slug, :description, :icon, :image_url, :icon_name, :position, :sort_order, :active, :coming_soon)
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
