# frozen_string_literal: true

module Bookings
  class ListBookings
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :status, optional: true

    def call
      scope = if user.admin_or_super_admin?
                Booking.all
              elsif user.provider? && user.service_provider.present?
                Booking.for_provider(user.service_provider.id)
              else
                user.bookings
              end

      scope = scope.by_status(status) if status.present?
      scope.recent
    end
  end
end
