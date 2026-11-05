# frozen_string_literal: true

module Quotations
  class RejectQuotation
    include Callable
    extend Dry::Initializer

    param :target, optional: true
    option :quotation, optional: true
    option :booking, optional: true
    option :user, type: Types.Instance(User)
    option :reason, optional: true

    def call
      resolved_quote = resolve_quotation
      raise DomainError, 'Quotation cannot be rejected (already resolved)' unless resolved_quote&.can_reject?

      resolved_quote.reject!(changed_by: user, reason: reason)
      NotificationService.notify_quotation_rejected(resolved_quote, reason)
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
