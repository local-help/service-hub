# frozen_string_literal: true

module ProviderAssignments
  class AcceptAssignment
    include Callable
    extend Dry::Initializer

    option :assignment, type: Types::Instance(ProviderAssignment)
    option :user, type: Types.Instance(User)
    option :notes, optional: true

    def call
      ActiveRecord::Base.transaction do
        assignment.accept!(by_user: user, notes: notes)
        assignment.booking.start_service! if assignment.booking.present? && assignment.booking.may_start_service?
        StatusHistory.create!(
          entity_type: 'ProviderAssignment',
          entity_id: assignment.id,
          previous_status: 'assigned',
          new_status: 'accepted',
          changed_by: user.id,
          notes: notes || 'Provider accepted the request assignment'
        )
      end

      NotificationService.notify_booking_status_updated(assignment.booking, assignment.booking.status, 'provider_assigned') if assignment.booking.present?

      assignment
    end
  end
end
