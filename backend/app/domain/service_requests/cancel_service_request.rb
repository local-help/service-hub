# frozen_string_literal: true

module ServiceRequests
  class CancelServiceRequest
    include Callable
    extend Dry::Initializer

    option :service_request, type: Types::Instance(ServiceRequest)
    option :user, type: Types.Instance(User).optional, optional: true
    option :reason, optional: true

    def call
      raise DomainError, "Cannot cancel request in #{service_request.status} status" if %w[completed cancelled].include?(service_request.status)

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
