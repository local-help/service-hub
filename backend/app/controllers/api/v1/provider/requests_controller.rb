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

          @assignment.accept!(notes: params[:notes])
          if @assignment.booking
            NotificationService.notify_booking_status_updated(@assignment.booking, @assignment.booking.status, 'provider_assigned')
          end
          render json: @assignment, serializer: ProviderAssignmentSerializer
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
          service_request = @assignment.service_request

          if service_request.active_quotation.present?
            render json: { error: 'An active quotation already exists for this service request' }, status: :unprocessable_entity
            return
          end

          valid_until = params[:valid_until].present? ? Time.zone.parse(params[:valid_until].to_s) : 48.hours.from_now

          booking = @assignment.booking || service_request.booking

          quotation = service_request.quotations.build(
            amount: params[:amount],
            description: params[:description],
            valid_until: valid_until,
            provider: current_provider,
            provider_assignment: @assignment,
            booking: booking,
            created_by: current_user.id,
            status: 'submitted'
          )

          ActiveRecord::Base.transaction do
            quotation.save!

            if service_request.can_transition_to?('quotation_sent')
              service_request.transition_to!(
                'quotation_sent',
                changed_by: current_user,
                notes: "Provider submitted quotation: ₹#{quotation.amount}"
              )
            end
          end

          NotificationService.notify_quotation_received(quotation)

          render json: quotation, serializer: QuotationSerializer, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end

        private

        def set_assignment
          @assignment = current_provider.provider_assignments.find(params[:id])
        end
      end
    end
  end
end

