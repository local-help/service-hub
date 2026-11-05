# frozen_string_literal: true

module Bookings
  class UpdateBookingStatus
    include Callable

    attr_reader :booking, :new_status, :user, :notes, :admin_notes

    def initialize(booking:, new_status: nil, user: nil, notes: nil, admin_notes: nil)
      @booking = booking.is_a?(Booking) ? booking : Booking.find(booking)
      @new_status = new_status.presence&.to_s
      @user = user
      @notes = notes || admin_notes
      @admin_notes = admin_notes
    end

    def call
      old_status = booking.status

      ActiveRecord::Base.transaction do
        if new_status.present? && new_status != old_status
          booking.transition_to!(new_status, changed_by: user, notes: notes)

          if booking.service_request.present?
            if new_status == 'in_progress' && booking.service_request.can_transition_to?('in_progress')
              booking.service_request.transition_to!('in_progress', changed_by: user)
            elsif new_status == 'completed' && booking.service_request.can_transition_to?('completed')
              booking.service_request.transition_to!('completed', changed_by: user)
            end
          end

          NotificationService.notify_booking_status_updated(booking, old_status, new_status)
        end

        booking.update!(admin_notes: admin_notes) if admin_notes.present?

        if user&.admin_or_super_admin?
          AdminActivityLog.log!(
            admin: user,
            action: 'update_booking',
            entity: booking,
            metadata: { status: booking.status, admin_notes: admin_notes }
          )
        end
      end

      booking
    end
  end
end
