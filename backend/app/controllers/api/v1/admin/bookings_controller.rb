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

          ActiveRecord::Base.transaction do
            if params[:status].present? && params[:status] != booking.status
              booking.transition_to!(
                params[:status],
                changed_by: current_user,
                notes: params[:admin_notes]
              )

              if booking.service_request.present?
                if params[:status] == 'in_progress' && booking.service_request.can_transition_to?('in_progress')
                  booking.service_request.transition_to!('in_progress', changed_by: current_user)
                elsif params[:status] == 'completed' && booking.service_request.can_transition_to?('completed')
                  booking.service_request.transition_to!('completed', changed_by: current_user)
                end
              end
            end

            booking.update!(admin_notes: params[:admin_notes]) if params[:admin_notes].present?

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_booking',
              entity: booking,
              metadata: { status: booking.status }
            )
          end

          render json: booking, serializer: BookingDetailSerializer
        end

        def assign_provider
          booking = Booking.find(params[:id])
          provider = ::Provider.eligible_for_assignment.find(params[:provider_id])

          ActiveRecord::Base.transaction do
            booking.assign_to_provider!(
              provider,
              assigned_by: current_user,
              notes: params[:notes]
            )

            AdminActivityLog.log!(
              admin: current_user,
              action: 'assign_provider',
              entity: booking,
              metadata: { provider_id: provider.id, provider_name: provider.name, notes: params[:notes] }
            )
          end

          render json: booking, serializer: BookingDetailSerializer
        end

        def reschedule
          booking = Booking.find(params[:id])

          ActiveRecord::Base.transaction do
            booking.transition_to!('rescheduled', changed_by: current_user, notes: "Rescheduled by admin to #{params[:scheduled_at]}")
            booking.update!(scheduled_at: params[:scheduled_at])

            AdminActivityLog.log!(
              admin: current_user,
              action: 'reschedule_booking',
              entity: booking,
              metadata: { new_time: params[:scheduled_at] }
            )
          end

          render json: booking, serializer: BookingDetailSerializer
        end

        def cancel
          booking = Booking.find(params[:id])

          ActiveRecord::Base.transaction do
            booking.transition_to!('cancelled', changed_by: current_user, notes: params[:reason] || 'Cancelled by admin')
            booking.update!(cancellation_reason: params[:reason])

            if booking.service_request&.can_transition_to?('cancelled')
              booking.service_request.transition_to!('cancelled', changed_by: current_user, notes: 'Cancelled by admin')
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'cancel_booking',
              entity: booking,
              metadata: { reason: params[:reason] }
            )
          end

          render json: booking, serializer: BookingDetailSerializer
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
