# frozen_string_literal: true

module Bookings
  class RescheduleBooking
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :scheduled_at
    option :user, type: Types.Instance(User).optional, optional: true

    def call
      raise DomainError, 'New scheduled date/time is required' if scheduled_at.blank?

      old_status = booking.status

      ActiveRecord::Base.transaction do
        booking.transition_to!('rescheduled', changed_by: user, notes: "Rescheduled to #{scheduled_at}")
        booking.update!(scheduled_at: scheduled_at)
      end

      NotificationService.notify_booking_status_updated(booking, old_status, 'rescheduled')
      booking
    end
  end
end
