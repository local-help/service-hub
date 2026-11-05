# frozen_string_literal: true

module Bookings
  class RescheduleBooking
    include Callable

    attr_reader :booking, :scheduled_at, :user

    def initialize(booking:, scheduled_at:, user: nil)
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @scheduled_at = scheduled_at
      @user = user
    end

    def call
      raise DomainError, 'New scheduled date/time is required' unless scheduled_at.present?

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
