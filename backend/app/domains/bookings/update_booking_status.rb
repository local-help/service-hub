# frozen_string_literal: true

module Bookings
  class UpdateBookingStatus
    include Callable

    attr_reader :booking, :new_status, :user, :notes

    def initialize(booking:, new_status:, user: nil, notes: nil)
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @new_status = new_status.to_s
      @user = user
      @notes = notes
    end

    def call
      old_status = booking.status

      ActiveRecord::Base.transaction do
        booking.transition_to!(new_status, changed_by: user, notes: notes)
      end

      NotificationService.notify_booking_status_updated(booking, old_status, new_status)
      booking
    end
  end
end
