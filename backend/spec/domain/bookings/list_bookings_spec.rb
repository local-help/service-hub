# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Bookings::ListBookings do
  let(:customer) { create(:user) }
  let(:other_customer) { create(:user) }
  let(:admin) { create(:user, :admin) }

  let!(:booking1) { create(:booking, user: customer, status: 'confirmed') }
  let!(:booking2) { create(:booking, user: customer, status: 'completed') }
  let!(:other_booking) { create(:booking, user: other_customer, status: 'confirmed') }

  describe '.call' do
    context 'for customer' do
      it 'returns only bookings belonging to the customer' do
        results = described_class.call(user: customer)
        expect(results).to include(booking1, booking2)
        expect(results).not_to include(other_booking)
      end

      it 'filters by status when provided' do
        results = described_class.call(user: customer, status: 'confirmed')
        expect(results).to include(booking1)
        expect(results).not_to include(booking2)
      end
    end

    context 'for administrator' do
      it 'returns all bookings across the platform' do
        results = described_class.call(user: admin)
        expect(results).to include(booking1, booking2, other_booking)
      end
    end
  end
end

