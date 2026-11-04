module Api
  module V1
    class ServicesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        services = Service.active.sorted.includes(:category)
        services = services.by_category(params[:category_id]) if params[:category_id].present?
        services = services.search(params[:q]) if params[:q].present?
        services = paginate(services)
        render json: services, each_serializer: ServiceSerializer, meta: pagination_meta(services)
      end

      def show
        service = Service.active.find(params[:id])
        render json: service, serializer: ServiceDetailSerializer
      end

      private

      def skip_authorization?
        true
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

