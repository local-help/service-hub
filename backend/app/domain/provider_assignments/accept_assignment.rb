# frozen_string_literal: true

module ProviderAssignments
  class AcceptAssignment
    include Callable

    attr_reader :assignment, :user

    def initialize(assignment:, user:)
      @assignment = assignment.is_a?(ProviderAssignment) ? assignment : ProviderAssignment.find(assignment)
      @user = user
    end

    def call
      ActiveRecord::Base.transaction do
        assignment.accept!(by_user: user)
        if assignment.booking.present? && assignment.booking.may_start_service?
          assignment.booking.start_service!
        end
        StatusHistory.create!(
          entity_type: 'ProviderAssignment',
          entity_id: assignment.id,
          previous_status: 'assigned',
          new_status: 'accepted',
          changed_by: user.id,
          notes: 'Provider accepted the request assignment'
        )
      end

      if assignment.booking.present?
        NotificationService.notify_booking_status_updated(assignment.booking, assignment.booking.status, 'provider_assigned')
      end

      assignment
    end
  end
end

