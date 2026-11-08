# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Bookings::SubmitFeedback do
  let(:customer) { create(:user) }
  let(:booking) { create(:booking, user: customer, status: 'completed') }

  describe '.run' do
    context 'with valid feedback on completed booking' do
      it 'records rating and feedback successfully' do
        result = described_class.run(
          booking: booking,
          rating: 5,
          feedback: 'Outstanding service and punctuality!',
          user: customer
        )

        expect(result).to be_success
        updated_booking = result.value!
        expect(updated_booking.rating).to eq(5)
        expect(updated_booking.feedback).to eq('Outstanding service and punctuality!')
      end
    end

    context 'when booking is not completed' do
      let(:pending_booking) { create(:booking, user: customer, status: 'confirmed') }

      it 'returns a failure result' do
        result = described_class.run(
          booking: pending_booking,
          rating: 4,
          feedback: 'Premature feedback',
          user: customer
        )

        expect(result).to be_failure
        expect(result.failure).to include('completed bookings')
      end
    end

    context 'with invalid rating value' do
      it 'rejects rating greater than 5' do
        result = described_class.run(
          booking: booking,
          rating: 6,
          user: customer
        )

        expect(result).to be_failure
        expect(result.failure).to include('between 1 and 5')
      end

      it 'rejects rating less than 1' do
        result = described_class.run(
          booking: booking,
          rating: 0,
          user: customer
        )

        expect(result).to be_failure
        expect(result.failure).to include('between 1 and 5')
      end
    end
  end

  describe '.run!' do
    it 'raises CommandFailure on failure' do
      pending_booking = create(:booking, user: customer, status: 'confirmed')

      expect do
        described_class.run!(
          booking: pending_booking,
          rating: 4,
          user: customer
        )
      end.to raise_error(CommandFailure, /completed bookings/)
    end
  end
end

