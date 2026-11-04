module Api
  module V1
    class SubcategoriesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        subcategories = Subcategory.active.sorted
        subcategories = subcategories.where(category_id: params[:category_id]) if params[:category_id].present?
        render json: subcategories, each_serializer: SubcategorySerializer
      end

      def show
        subcategory = Subcategory.active.find(params[:id])
        services = subcategory.services.active.sorted
        render json: {
          subcategory: SubcategorySerializer.new(subcategory).as_json,
          services: ActiveModelSerializers::SerializableResource.new(services, each_serializer: ServiceSerializer).as_json
        }
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
