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
        service = Service.find(params[:service_id] || params.dig(:booking, :service_id))
        address = current_user.addresses.find(params[:address_id] || params.dig(:booking, :address_id))

        desc = params[:description] || params.dig(:booking, :description)
        pref = params[:preferred_at] || params.dig(:booking, :preferred_at) || params[:scheduled_at]
        v_id = params[:service_variant_id] || params.dig(:booking, :service_variant_id)
        v_type = params[:vehicle_type] || params.dig(:booking, :vehicle_type)
        dur = params[:duration_hours] || params.dig(:booking, :duration_hours)
        opts = params[:selected_options] || params.dig(:booking, :selected_options) || {}

        booking = current_user.bookings.build(
          service: service,
          address: address,
          description: desc,
          preferred_at: pref,
          scheduled_at: pref,
          service_variant_id: v_id,
          vehicle_type: v_type,
          duration_hours: dur,
          selected_options: opts,
          booking_type: service.booking_type,
          total_amount: service.fixed_price
        )
        authorize booking

        ActiveRecord::Base.transaction do
          booking.save!

          # Save any attached photos
          if params[:attachments].is_a?(Array)
            params[:attachments].each do |att|
              booking.request_attachments.create!(
                file_url: att[:file_url] || att,
                file_name: att[:file_name],
                content_type: att[:content_type],
                file_size: att[:file_size]
              )
            end
          end
        end

        NotificationService.notify_booking_confirmed(booking)

        render json: booking, serializer: BookingDetailSerializer, status: :created
      end

      def reschedule
        booking = Booking.find(params[:id])
        authorize booking

        unless params[:scheduled_at].present?
          render json: { error: 'New scheduled date/time is required' }, status: :unprocessable_entity
          return
        end

        old_status = booking.status
        booking.transition_to!('rescheduled', changed_by: current_user, notes: "Reschedule requested to #{params[:scheduled_at]}")
        booking.update!(scheduled_at: params[:scheduled_at])

        NotificationService.notify_booking_status_updated(booking, old_status, 'rescheduled')

        render json: booking, serializer: BookingDetailSerializer
      end

      def cancel
        booking = Booking.find(params[:id])
        authorize booking

        if %w[completed cancelled].include?(booking.status)
          render json: { error: "Cannot cancel booking in #{booking.status} status" }, status: :unprocessable_entity
          return
        end

        booking.transition_to!('cancelled', changed_by: current_user, notes: params[:reason] || 'Cancelled by customer')
        booking.update!(cancellation_reason: params[:reason])

        if booking.service_request&.can_transition_to?('cancelled')
          booking.service_request.transition_to!('cancelled', changed_by: current_user, notes: 'Cancelled due to booking cancellation')
        end

        NotificationService.notify_booking_cancelled(booking, params[:reason], current_user)

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

      def approve_quotation
        booking = Booking.find(params[:id])
        authorize booking, :show?

        quotation = booking.active_quotation
        unless quotation && quotation.can_approve?
          render json: { error: 'No actionable quotation to approve' }, status: :unprocessable_entity
          return
        end

        quotation.approve!(changed_by: current_user)
        NotificationService.notify_quotation_approved(quotation)
        render json: booking.reload, serializer: BookingDetailSerializer
      end

      def reject_quotation
        booking = Booking.find(params[:id])
        authorize booking, :show?

        quotation = booking.active_quotation
        unless quotation && quotation.can_reject?
          render json: { error: 'No actionable quotation to reject' }, status: :unprocessable_entity
          return
        end

        quotation.reject!(changed_by: current_user, reason: params[:reason])
        NotificationService.notify_quotation_rejected(quotation, params[:reason])
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
