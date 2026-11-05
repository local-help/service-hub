module Api
  module V1
    class ServiceRequestsController < ApplicationController
      def index
        requests = policy_scope(ServiceRequest).includes(:service, :user, :provider, :quotation, :booking, service: :category).recent
        requests = requests.by_status(params[:status]) if params[:status].present?
        requests = paginate(requests)
        render json: requests, each_serializer: ServiceRequestSerializer, meta: pagination_meta(requests)
      end

      def show
        service_request = ServiceRequest.find(params[:id])
        authorize service_request
        render json: service_request, serializer: ServiceRequestDetailSerializer
      end

      def create
        authorize ServiceRequest
        service_request = ServiceRequests::CreateServiceRequest.call(user: current_user, params: params)
        render json: service_request, serializer: ServiceRequestDetailSerializer, status: :created
      end

      def cancel
        service_request = ServiceRequest.find(params[:id])
        authorize service_request

        ServiceRequests::CancelServiceRequest.call(service_request: service_request, user: current_user, reason: params[:reason])
        render json: service_request.reload, serializer: ServiceRequestDetailSerializer
      end

      private

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

