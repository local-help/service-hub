module Api
  module V1
    module Admin
      class DashboardController < ApplicationController
        before_action :require_admin!

        def show
          total_requests = ServiceRequest.count
          pending_requests = ServiceRequest.where(status: 'pending_review').count
          contacting_provider = ServiceRequest.where(status: 'contacting_provider').count
          quotation_sent = ServiceRequest.where(status: 'quotation_sent').count
          quotation_approved = ServiceRequest.where(status: 'quotation_approved').count

          confirmed_bookings = Booking.where(status: 'confirmed').count
          in_progress_bookings = Booking.where(status: 'in_progress').count
          completed_bookings = Booking.where(status: 'completed').count
          cancelled_bookings = Booking.where(status: 'cancelled').count

          total_revenue = Payment.where(status: 'paid').sum(:amount).to_f
          total_providers = ::Provider.active.count
          total_customers = User.customers.count

          recent_requests = ServiceRequest.includes(:service, :user).recent.limit(5)

          render json: {
            metrics: {
              total_requests: total_requests,
              pending_review: pending_requests,
              contacting_provider: contacting_provider,
              awaiting_quotation: contacting_provider,
              quotation_sent: quotation_sent,
              quotation_approved: quotation_approved,
              confirmed_bookings: confirmed_bookings,
              in_progress_bookings: in_progress_bookings,
              completed_bookings: completed_bookings,
              cancelled_bookings: cancelled_bookings,
              total_revenue: total_revenue,
              active_providers: total_providers,
              total_customers: total_customers
            },
            recent_requests: ActiveModelSerializers::SerializableResource.new(
              recent_requests,
              each_serializer: ServiceRequestSerializer
            ).as_json
          }
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end
