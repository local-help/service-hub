# frozen_string_literal: true

module Bookings
  class ListBookings
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :status, optional: true

    def self.base_scope(user, initial_scope = Booking.all)
      if user.admin_or_super_admin?
        initial_scope
      elsif user.provider? && user.service_provider.present?
        initial_scope.for_provider(user.service_provider.id)
      else
        initial_scope.where(user_id: user.id)
      end
    end

    def call
      scope = self.class.base_scope(user)
      scope = scope.by_status(status) if status.present?
      scope.recent
    end
  end
end
