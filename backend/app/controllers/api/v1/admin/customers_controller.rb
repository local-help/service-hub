module Api
  module V1
    module Admin
      class CustomersController < ApplicationController
        before_action :require_admin!

        def index
          customers = User.customers.order(created_at: :desc)

          if params[:q].present?
            q = "%#{params[:q]}%"
            customers = customers.where("name ILIKE :q OR email ILIKE :q OR phone ILIKE :q", q: q)
          end

          customers = paginate(customers)
          render json: customers, each_serializer: UserSerializer, meta: pagination_meta(customers)
        end

        def show
          customer = User.customers.find(params[:id])
          addresses = customer.addresses.default_first
          requests = customer.service_requests.recent.limit(20)
          bookings = Booking.joins(:service_request).where(service_requests: { user_id: customer.id }).recent.limit(20)

          render json: {
            customer: UserSerializer.new(customer).as_json,
            addresses: ActiveModelSerializers::SerializableResource.new(addresses, each_serializer: AddressSerializer).as_json,
            requests: ActiveModelSerializers::SerializableResource.new(requests, each_serializer: ServiceRequestSerializer).as_json,
            bookings: ActiveModelSerializers::SerializableResource.new(bookings, each_serializer: BookingSerializer).as_json
          }
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

