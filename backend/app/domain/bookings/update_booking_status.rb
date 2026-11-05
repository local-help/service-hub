# frozen_string_literal: true

module Bookings
  class UpdateBookingStatus
    include Callable
    extend Dry::Initializer

    option :booking, type: Types::Instance(Booking)
    option :new_status, optional: true
    option :user, type: Types.Instance(User).optional, optional: true
    option :notes, optional: true
    option :admin_notes, optional: true

    def call
      target_status = new_status.presence&.to_s
      status_notes = notes || admin_notes
      old_status = booking.status

      ActiveRecord::Base.transaction do
        if target_status.present? && target_status != old_status
          booking.transition_to!(target_status, changed_by: user, notes: status_notes)

          if booking.service_request.present?
            if target_status == 'in_progress' && booking.service_request.can_transition_to?('in_progress')
              booking.service_request.transition_to!('in_progress', changed_by: user)
            elsif target_status == 'completed' && booking.service_request.can_transition_to?('completed')
              booking.service_request.transition_to!('completed', changed_by: user)
            end
          end

          NotificationService.notify_booking_status_updated(booking, old_status, target_status)
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
