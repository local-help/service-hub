# frozen_string_literal: true

module Quotations
  class ApproveQuotation
    include Callable
    extend Dry::Initializer

    param :target, optional: true
    option :quotation, optional: true
    option :booking, optional: true
    option :user, type: Types.Instance(User)

    def call
      resolved_quote = resolve_quotation
      raise DomainError, 'Quotation cannot be approved (already resolved or expired)' if resolved_quote.nil? || resolved_quote.expired?
      raise DomainError, 'Quotation cannot be approved (already resolved or expired)' unless resolved_quote.can_approve?

      ActiveRecord::Base.transaction do
        resolved_quote.approve!(changed_by: user)

        # Auto-create or confirm booking if service request has no booking yet
        if resolved_quote.service_request.present?
          sr = resolved_quote.service_request
          target_booking = sr.booking || sr.build_booking(
            user: sr.user,
            service: sr.service,
            service_variant: sr.service_variant,
            address: sr.address
          )
          target_booking.quotation = resolved_quote
          target_booking.scheduled_at = sr.preferred_at || 1.day.from_now
          target_booking.status = 'confirmed'
          target_booking.total_amount = resolved_quote.amount
          target_booking.description = sr.description.presence || resolved_quote.description.presence || 'Service Booking'
          target_booking.save!

          sr.transition_to!('booking_confirmed', changed_by: user, notes: 'Booking confirmed upon quotation approval') if sr.can_transition_to?('booking_confirmed')
        end
      end

      NotificationService.notify_quotation_approved(resolved_quote)
      resolved_quote
    end

    private

    def resolve_quotation
      q = quotation || target
      if q.is_a?(Quotation)
        q
      elsif q.respond_to?(:active_quotation) && q.active_quotation.present?
        q.active_quotation
      elsif q.respond_to?(:quotation) && q.quotation.present?
        q.quotation
      elsif booking.present?
        booking.active_quotation || booking.quotation
      elsif q.present?
        Quotation.find_by(id: q)
      end
    end
  end
end
