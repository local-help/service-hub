# frozen_string_literal: true

module Quotations
  class RejectQuotation
    include Callable

    attr_reader :quotation, :user, :reason

    def initialize(quotation_or_booking, user:, reason: nil)
      @user = user
      @reason = reason
      @quotation = if quotation_or_booking.is_a?(Quotation)
                     quotation_or_booking
                   elsif quotation_or_booking.respond_to?(:active_quotation)
                     quotation_or_booking.active_quotation
                   elsif quotation_or_booking.respond_to?(:quotation)
                     quotation_or_booking.quotation
                   else
                     Quotation.find(quotation_or_booking)
                   end
    end

    def call
      raise DomainError, 'No actionable quotation to reject' unless quotation && quotation.can_reject?

      quotation.reject!(changed_by: user, reason: reason)
      NotificationService.notify_quotation_rejected(quotation, reason)
      quotation
    end
  end
end
