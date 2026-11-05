# frozen_string_literal: true

module ProviderAssignments
  class RejectAssignment
    include Callable

    attr_reader :assignment, :reason, :notes

    def initialize(assignment:, reason:, notes: nil)
      @assignment = assignment.is_a?(ProviderAssignment) ? assignment : ProviderAssignment.find(assignment)
      @reason = reason.to_s.strip
      @notes = notes
    end

    def call
      raise DomainError, 'Rejection reason is required' if reason.blank?

      assignment.reject!(reason: reason, notes: notes)
      assignment
    end
  end
end
