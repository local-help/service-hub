module Api
  module V1
    class BookingsController < ApplicationController
      def index
        bookings = policy_scope(Booking).includes(:service, :user, :provider, :address, :quotation, service: :category).recent
        bookings = bookings.by_status(params[:status]) if params[:status].present?
        bookings = paginate(bookings)
        render json: bookings, each_serializer: BookingSerializer, meta: pagination_meta(bookings)
      end

      def show
        booking = Booking.find(params[:id])
        authorize booking
        render json: booking, serializer: BookingDetailSerializer
      end

      def create
        authorize Booking
        booking = Bookings::CreateBooking.call(user: current_user, params: params)
        render json: booking, serializer: BookingDetailSerializer, status: :created
      end

      def reschedule
        booking = Booking.find(params[:id])
        authorize booking

        Bookings::RescheduleBooking.call(booking: booking, scheduled_at: params[:scheduled_at], user: current_user)
        render json: booking.reload, serializer: BookingDetailSerializer
      end

      def cancel
        booking = Booking.find(params[:id])
        authorize booking

        Bookings::CancelBooking.call(booking: booking, user: current_user, reason: params[:reason])
        render json: booking.reload, serializer: BookingDetailSerializer
      end

      def feedback
        booking = Booking.find(params[:id])
        authorize booking

        booking = Bookings::SubmitFeedback.run!(
          booking: booking,
          rating: params[:rating],
          feedback: params[:feedback],
          user: current_user
        )
        render json: booking, serializer: BookingDetailSerializer
      end

      def approve_quotation
        booking = Booking.find(params[:id])
        authorize booking, :show?

        Quotations::ApproveQuotation.call(booking, user: current_user)
        render json: booking.reload, serializer: BookingDetailSerializer
      end

      def reject_quotation
        booking = Booking.find(params[:id])
        authorize booking, :show?

        Quotations::RejectQuotation.call(booking, user: current_user, reason: params[:reason])
        render json: booking.reload, serializer: BookingDetailSerializer
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
