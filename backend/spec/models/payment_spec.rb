# frozen_string_literal: true

# == Schema Information
#
# Table name: payments
#
#  id                :bigint           not null, primary key
#  amount            :decimal(10, 2)   not null
#  gateway_metadata  :jsonb
#  gateway_reference :string
#  method            :string           not null
#  recorded_by       :bigint
#  status            :string           default("pending"), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  booking_id        :bigint           not null
#  gateway_order_id  :string
#
# Indexes
#
#  index_payments_on_booking_id         (booking_id)
#  index_payments_on_gateway_order_id   (gateway_order_id) UNIQUE WHERE (gateway_order_id IS NOT NULL)
#  index_payments_on_gateway_reference  (gateway_reference) UNIQUE WHERE (gateway_reference IS NOT NULL)
#  index_payments_on_status             (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (recorded_by => users.id)
#
require 'rails_helper'

RSpec.describe Payment, type: :model do
  let(:customer) { create(:user) }
  let(:admin) { create(:user, :admin) }
  let(:category) { create(:category) }
  let(:service) { create(:service, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:booking) do
    Booking.create!(
      user: customer,
      service: service,
      address: address,
      description: 'Painting service',
      total_amount: 1500.0,
      status: 'confirmed'
    )
  end

  describe 'AASM states and transitions' do
    let(:payment) do
      Payment.create!(
        booking: booking,
        amount: 1500.0,
        method: 'online',
        status: 'pending'
      )
    end

    it 'initializes in pending state' do
      expect(payment.pending?).to be true
      expect(payment.paid?).to be false
      expect(payment.can_refund?).to be false
    end

    it 'processes and marks as paid' do
      payment.process!
      expect(payment.processing?).to be true

      payment.mark_paid!
      expect(payment.paid?).to be true
      expect(payment.can_refund?).to be true
    end

    it 'allows refunding a paid payment' do
      payment.mark_paid!
      expect(payment.can_refund?).to be true

      payment.refund!
      expect(payment.refunded?).to be true
      expect(payment.can_refund?).to be false
    end

    it 'handles failure transition' do
      payment.mark_failed!
      expect(payment.failed?).to be true
      expect(payment.can_refund?).to be false
    end
  end
end
