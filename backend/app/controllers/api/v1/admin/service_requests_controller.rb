module Api
  module V1
    module Admin
      class ServiceRequestsController < ApplicationController
        before_action :require_admin!

        def index
          requests = ServiceRequest.includes(:service, :user, :provider, :quotation, :booking, service: :category).recent

          # Filters
          requests = requests.by_status(params[:status]) if params[:status].present?
          requests = requests.by_service(params[:service_id]) if params[:service_id].present?

          if params[:category_id].present?
            requests = requests.joins(:service).where(services: { category_id: params[:category_id] })
          end

          if params[:provider_id].present?
            requests = requests.where(provider_id: params[:provider_id])
          end

          if params[:q].present?
            q = "%#{params[:q]}%"
            requests = requests.joins(:user).where(
              "service_requests.reference_number ILIKE :q OR users.name ILIKE :q OR users.phone ILIKE :q",
              q: q
            )
          end

          requests = paginate(requests)
          render json: requests, each_serializer: ServiceRequestSerializer, meta: pagination_meta(requests)
        end

        def show
          service_request = ServiceRequest.find(params[:id])
          render json: service_request, serializer: ServiceRequestDetailSerializer
        end

        def update
          service_request = ServiceRequest.find(params[:id])

          ActiveRecord::Base.transaction do
            if params[:status].present? && params[:status] != service_request.status
              service_request.transition_to!(
                params[:status],
                changed_by: current_user,
                notes: params[:admin_notes]
              )
            end

            service_request.update!(admin_notes: params[:admin_notes]) if params[:admin_notes].present?

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_request',
              entity: service_request,
              metadata: { status: service_request.status, notes: params[:admin_notes] }
            )
          end

          render json: service_request, serializer: ServiceRequestDetailSerializer
        end

        def assign_provider
          service_request = ServiceRequest.find(params[:id])
          provider = ::Provider.eligible_for_assignment.find(params[:provider_id])

          ActiveRecord::Base.transaction do
            service_request.assign_provider!(
              provider,
              assigned_by: current_user,
              notes: params[:notes]
            )

            AdminActivityLog.log!(
              admin: current_user,
              action: 'assign_provider',
              entity: service_request,
              metadata: { provider_id: provider.id, provider_name: provider.name, notes: params[:notes] }
            )
          end

          render json: service_request, serializer: ServiceRequestDetailSerializer
        end

        def reassign_provider
          service_request = ServiceRequest.find(params[:id])
          provider = ::Provider.eligible_for_assignment.find(params[:provider_id])

          ActiveRecord::Base.transaction do
            service_request.assign_provider!(
              provider,
              assigned_by: current_user,
              notes: params[:notes] || 'Reassigned by admin'
            )

            AdminActivityLog.log!(
              admin: current_user,
              action: 'reassign_provider',
              entity: service_request,
              metadata: { provider_id: provider.id, provider_name: provider.name, notes: params[:notes] }
            )
          end

          render json: service_request, serializer: ServiceRequestDetailSerializer
        end

        def assignment_history
          service_request = ServiceRequest.find(params[:id])
          assignments = service_request.provider_assignments.order(created_at: :desc)

          render json: assignments, each_serializer: ProviderAssignmentSerializer
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
end
