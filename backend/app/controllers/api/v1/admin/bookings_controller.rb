module Api
  module V1
    module Admin
      class BookingsController < ApplicationController
        before_action :require_admin!

        def index
          bookings = Booking.includes(:service, :user, :provider, service: :category).recent
          bookings = bookings.by_status(params[:status]) if params[:status].present?

          if params[:q].present?
            q = "%#{params[:q]}%"
            bookings = bookings.joins(:user).where(
              "bookings.reference_number ILIKE :q OR users.name ILIKE :q OR users.phone ILIKE :q",
              q: q
            )
          end

          bookings = paginate(bookings)
          render json: bookings, each_serializer: BookingSerializer, meta: pagination_meta(bookings)
        end

        def show
          booking = Booking.find(params[:id])
          render json: booking, serializer: BookingDetailSerializer
        end

        def update
          booking = Booking.find(params[:id])

          Bookings::UpdateBookingStatus.call(
            booking: booking,
            new_status: params[:status],
            user: current_user,
            admin_notes: params[:admin_notes]
          )

          render json: booking.reload, serializer: BookingDetailSerializer
        end

        def assign_provider
          booking = Booking.find(params[:id])
          provider = ::Provider.eligible_for_assignment.find(params[:provider_id])

          ProviderAssignments::AssignProvider.call(
            target: booking,
            provider: provider,
            assigned_by: current_user,
            notes: params[:notes]
          )

          render json: booking.reload, serializer: BookingDetailSerializer
        end

        def reschedule
          booking = Booking.find(params[:id])

          Bookings::RescheduleBooking.call(
            booking: booking,
            scheduled_at: params[:scheduled_at],
            user: current_user
          )

          render json: booking.reload, serializer: BookingDetailSerializer
        end

        def cancel
          booking = Booking.find(params[:id])

          Bookings::CancelBooking.call(
            booking: booking,
            user: current_user,
            reason: params[:reason]
          )

          render json: booking.reload, serializer: BookingDetailSerializer
        end

        private

        def skip_authorization?
          true
        end

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
end
