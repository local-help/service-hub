# frozen_string_literal: true

module ProviderAssignments
  class RejectAssignment
    include Callable
    extend Dry::Initializer

    option :assignment, type: Types::Instance(ProviderAssignment)
    option :reason
    option :notes, optional: true

    def call
      cleaned_reason = reason.to_s.strip
      raise DomainError, 'Rejection reason is required' if cleaned_reason.blank?

      assignment.reject!(reason: cleaned_reason, notes: notes)
      assignment
    end
  end
end
