# frozen_string_literal: true

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
        end

        def reject
          assignment = ProviderAssignments::RejectAssignment.call(
            assignment: @assignment,
            reason: params[:reason],
            notes: params[:notes]
          )
          render json: assignment, serializer: ProviderAssignmentSerializer
        end

        def update_status
          assignment = ProviderAssignments::UpdateAssignmentStatus.call(
            assignment: @assignment,
            target_status: params[:status],
            notes: params[:notes]
          )
          render json: assignment, serializer: ProviderAssignmentSerializer
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
