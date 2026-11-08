# frozen_string_literal: true

module Bookings
  class SubmitFeedback
    include Command

    option :booking, type: Types.Instance(Booking)
    option :rating
    option :feedback, optional: true
    option :user, type: Types.Instance(User).optional, optional: true

    def run
      return Failure('Feedback can only be submitted for completed bookings') unless booking.completed?

      parsed_rating = rating.to_i
      return Failure('Rating must be between 1 and 5') unless (1..5).cover?(parsed_rating)

      ActiveRecord::Base.transaction do
        booking.update!(
          rating: parsed_rating,
          feedback: feedback.presence
        )

        AdminActivityLog.log!(
          admin: user,
          action: 'submit_feedback',
          entity: booking,
          metadata: { rating: parsed_rating, feedback: feedback.presence }
        )
      end

      NotificationService.create_notification(
        user: booking.user,
        type: 'feedback_received',
        title: "Feedback Recorded: #{booking.service&.name}",
        body: "Thank you for rating your service #{parsed_rating}/5 stars.",
        metadata: {
          booking_id: booking.id,
          reference_number: booking.reference_number,
          action_url: '/bookings'
        }
      )

      Success(booking)
    rescue ActiveRecord::RecordInvalid => e
      Failure(e.record.errors.full_messages.join(', '))
    end
  end
end

