# frozen_string_literal: true

module Bookings
  class CreateBooking
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :params
    option :attachments, optional: true

    def call
      Orders::CreateOrder.call(user: user, params: params, attachments: attachments)
    end
  end
end
