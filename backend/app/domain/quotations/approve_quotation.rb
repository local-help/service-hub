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
      raise DomainError, 'Quotation cannot be approved (already resolved or expired)' if quotation.nil? || quotation.expired?
      raise DomainError, 'Quotation cannot be approved (already resolved or expired)' unless quotation.can_approve?

      ActiveRecord::Base.transaction do
        quotation.approve!(changed_by: user)

        # Auto-create or confirm booking if service request has no booking yet
        if quotation.service_request.present?
          sr = quotation.service_request
          booking = sr.booking || sr.build_booking(
            user: sr.user,
            service: sr.service,
            service_variant: sr.service_variant,
            address: sr.address
          )
          booking.quotation = quotation
          booking.scheduled_at = sr.preferred_at || 1.day.from_now
          booking.status = 'confirmed'
          booking.total_amount = quotation.amount
          booking.description = sr.description.presence || quotation.description.presence || 'Service Booking'
          booking.save!

          sr.transition_to!('booking_confirmed', changed_by: user, notes: 'Booking confirmed upon quotation approval') if sr.can_transition_to?('booking_confirmed')
        end
      end

      NotificationService.notify_quotation_approved(quotation)
      quotation
    end
  end
end
