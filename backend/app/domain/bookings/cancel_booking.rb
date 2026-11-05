# frozen_string_literal: true

module Bookings
  class CancelBooking
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :user, type: Types.Instance(User).optional, optional: true
    option :reason, optional: true

    def call
      raise DomainError, "Cannot cancel booking in #{booking.status} status" if %w[completed cancelled].include?(booking.status)

      ActiveRecord::Base.transaction do
        booking.transition_to!('cancelled', changed_by: user, notes: reason || 'Cancelled')
        booking.update!(cancellation_reason: reason)

        if booking.service_request&.can_transition_to?('cancelled')
          booking.service_request.transition_to!('cancelled', changed_by: user, notes: 'Cancelled due to booking cancellation')
        end
      end

      NotificationService.notify_booking_cancelled(booking, reason, user)
      booking
    end
  end
end
