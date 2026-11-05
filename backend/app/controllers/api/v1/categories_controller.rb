module Api
  module V1
    class CategoriesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        categories = Category.active.sorted.includes(:services, :subcategories)
        render json: categories, each_serializer: CategorySerializer
      end

      def show
        category = Category.active.find(params[:id])
        render json: category, serializer: CategoryDetailSerializer
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
