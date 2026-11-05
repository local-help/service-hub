# frozen_string_literal: true

module ServiceRequests
  class CancelServiceRequest
    include Callable

    attr_reader :service_request, :user, :reason

    def initialize(service_request:, user: nil, reason: nil)
      @service_request = service_request.is_a?(ServiceRequest) ? service_request : ServiceRequest.find(service_request)
      @user = user
      @reason = reason
    end

    def call
      if %w[completed cancelled].include?(service_request.status)
        raise DomainError, "Cannot cancel request in #{service_request.status} status"
      end

      ActiveRecord::Base.transaction do
        service_request.transition_to!('cancelled', changed_by: user, notes: reason || 'Cancelled by customer')
        service_request.update!(cancellation_reason: reason)

        if service_request.booking&.can_cancel?
          service_request.booking.transition_to!('cancelled', changed_by: user, notes: 'Cancelled due to service request cancellation')
          NotificationService.notify_booking_cancelled(service_request.booking, reason, user)
        end
      end

      service_request
    end
  end
end
