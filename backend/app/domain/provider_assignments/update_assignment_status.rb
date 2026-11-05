# frozen_string_literal: true

module ProviderAssignments
  class UpdateAssignmentStatus
    include Callable
    extend Dry::Initializer

    option :assignment, type: Types::Instance(ProviderAssignment)
    option :target_status
    option :notes, optional: true

    def call
      case target_status.to_s
      when 'in_progress'
        old_status = assignment.booking&.status
        assignment.start_service!(notes: notes)
        NotificationService.notify_booking_status_updated(assignment.booking, old_status, 'in_progress') if assignment.booking
      when 'completed'
        old_status = assignment.booking&.status
        assignment.complete!(notes: notes)
        NotificationService.notify_booking_status_updated(assignment.booking, old_status, 'completed') if assignment.booking
      else
        raise DomainError, "Invalid status transition to #{target_status}. Allowed: in_progress, completed"
      end

      assignment
    end
  end
end
