# frozen_string_literal: true

# Order represents a customer's unified service request and booking.
# Backed by the bookings table with complete AASM state transitions.
class Order < Booking
  self.table_name = 'bookings'
end

