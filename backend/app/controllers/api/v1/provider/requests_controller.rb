module Api
  module V1
    module Provider
      class RequestsController < BaseController
        before_action :set_assignment, only: [:show, :accept, :reject, :update_status, :create_quotation]

        def index
          assignments = current_provider.provider_assignments
                                        .includes(:provider, service_request: [:service, :service_variant, :user, :address, :quotations])
                                        .order(created_at: :desc)

          if params[:status].present?
            statuses = params[:status].to_s.split(',').map(&:strip)
            assignments = assignments.where(status: statuses)
          end

          if params[:q].present?
            q = "%#{params[:q]}%"
            assignments = assignments.joins(:service_request)
                                     .joins("INNER JOIN users ON users.id = service_requests.user_id")
                                     .where("service_requests.reference_number ILIKE :q OR users.name ILIKE :q OR users.phone ILIKE :q", q: q)
          end

          assignments = paginate(assignments)
          render json: assignments, each_serializer: ProviderAssignmentSerializer, meta: pagination_meta(assignments)
        end

        def show
          render json: @assignment, serializer: ProviderAssignmentSerializer
        end

        def accept
          unless current_provider.eligible_for_assignment?
            render json: { error: 'Provider is not eligible to accept assignments' }, status: :unprocessable_entity
            return
          end

          assignment = ProviderAssignments::AcceptAssignment.call(assignment: @assignment, user: current_user)
          render json: assignment.reload, serializer: ProviderAssignmentSerializer
        rescue InvalidTransitionError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        def reject
          reason = params[:reason].to_s.strip
          if reason.blank?
            render json: { error: 'Rejection reason is required' }, status: :unprocessable_entity
            return
          end

          @assignment.reject!(reason: reason, notes: params[:notes])
          render json: @assignment, serializer: ProviderAssignmentSerializer
        rescue InvalidTransitionError, ArgumentError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        def update_status
          target_status = params[:status]

          case target_status
          when 'in_progress'
            old_status = @assignment.booking&.status
            @assignment.start_service!(notes: params[:notes])
            NotificationService.notify_booking_status_updated(@assignment.booking, old_status, 'in_progress') if @assignment.booking
          when 'completed'
            old_status = @assignment.booking&.status
            @assignment.complete!(notes: params[:notes])
            NotificationService.notify_booking_status_updated(@assignment.booking, old_status, 'completed') if @assignment.booking
          else
            render json: { error: "Invalid status transition to #{target_status}. Allowed: in_progress, completed" }, status: :unprocessable_entity
            return
          end

          render json: @assignment, serializer: ProviderAssignmentSerializer
        rescue InvalidTransitionError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        def create_quotation
          quotation = Quotations::CreateQuotation.call(
            provider: current_provider,
            created_by: current_user,
            params: params.merge(
              service_request_id: @assignment.service_request_id,
              booking_id: @assignment.booking_id
            )
          )
          render json: quotation, serializer: QuotationSerializer, status: :created
        end

        private

        def set_assignment
          @assignment = current_provider.provider_assignments.find(params[:id])
        end
      end
    end
  end
end

