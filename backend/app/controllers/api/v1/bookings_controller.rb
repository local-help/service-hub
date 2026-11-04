module Api
  module V1
    class BookingsController < ApplicationController
      def index
        bookings = policy_scope(Booking).includes(service_request: [:service, :user]).recent
        bookings = bookings.by_status(params[:status]) if params[:status].present?
        bookings = paginate(bookings)
        render json: bookings, each_serializer: BookingSerializer, meta: pagination_meta(bookings)
      end

      def show
        booking = Booking.find(params[:id])
        authorize booking
        render json: booking, serializer: BookingDetailSerializer
      end

      def reschedule
        booking = Booking.find(params[:id])
        authorize booking

        unless params[:scheduled_at].present?
          render json: { error: 'New scheduled date/time is required' }, status: :unprocessable_entity
          return
        end

        booking.transition_to!('rescheduled', changed_by: current_user, notes: "Reschedule requested to #{params[:scheduled_at]}")
        booking.update!(scheduled_at: params[:scheduled_at])

        render json: booking, serializer: BookingDetailSerializer
      end

      def cancel
        booking = Booking.find(params[:id])
        authorize booking

        booking.transition_to!('cancelled', changed_by: current_user, notes: params[:reason] || 'Cancelled by customer')
        booking.update!(cancellation_reason: params[:reason])

        if booking.service_request.can_transition_to?('cancelled')
          booking.service_request.transition_to!('cancelled', changed_by: current_user, notes: 'Cancelled due to booking cancellation')
        end

        render json: booking, serializer: BookingDetailSerializer
      end

      def feedback
        booking = Booking.find(params[:id])
        authorize booking

        if booking.status != 'completed'
          render json: { error: 'Feedback can only be submitted for completed bookings' }, status: :unprocessable_entity
          return
        end

        if booking.update(rating: params[:rating], feedback: params[:feedback])
          render json: booking, serializer: BookingDetailSerializer
        else
          render json: { error: booking.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

