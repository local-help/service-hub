# frozen_string_literal: true

module Quotations
  class ApproveQuotation
    include Callable

    attr_reader :quotation, :user

    def initialize(quotation_or_booking, user:)
      @user = user
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
      raise DomainError, 'No actionable quotation to approve' unless quotation && quotation.can_approve?

      quotation.approve!(changed_by: user)
      NotificationService.notify_quotation_approved(quotation)
      quotation
    end
  end
end

