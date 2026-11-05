# frozen_string_literal: true

module ProviderAssignments
  class UpdateAssignmentStatus
    include Callable

    attr_reader :assignment, :target_status, :notes

    def initialize(assignment:, target_status:, notes: nil)
      @assignment = assignment.is_a?(ProviderAssignment) ? assignment : ProviderAssignment.find(assignment)
      @target_status = target_status.to_s
      @notes = notes
    end

    def call
      case target_status
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
