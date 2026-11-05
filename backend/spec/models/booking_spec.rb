# frozen_string_literal: true

# == Schema Information
#
# Table name: bookings
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text
#  duration_hours      :integer
#  feedback            :text
#  preferred_at        :datetime
#  rating              :integer
#  reference_number    :string
#  scheduled_at        :datetime
#  selected_options    :jsonb
#  status              :string           default("confirmed"), not null
#  total_amount        :decimal(10, 2)
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint
#  provider_id         :bigint
#  quotation_id        :bigint
#  service_id          :bigint
#  service_request_id  :bigint
#  service_variant_id  :bigint
#  user_id             :bigint
#
# Indexes
#
#  index_bookings_on_address_id          (address_id)
#  index_bookings_on_provider_id         (provider_id)
#  index_bookings_on_quotation_id        (quotation_id)
#  index_bookings_on_reference_number    (reference_number) UNIQUE
#  index_bookings_on_scheduled_at        (scheduled_at)
#  index_bookings_on_service_id          (service_id)
#  index_bookings_on_service_request_id  (service_request_id) UNIQUE
#  index_bookings_on_service_variant_id  (service_variant_id)
#  index_bookings_on_status              (status)
#  index_bookings_on_user_id             (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (quotation_id => quotations.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe Booking, type: :model do
  let(:customer) { create(:user) }
  let(:category) { create(:category) }
  let(:service) { create(:service, :quotation_based, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:admin) { create(:user, :admin) }

  describe 'AASM states and transitions' do
    let(:booking) do
      Booking.create!(
        user: customer,
        service: service,
        address: address,
        description: 'Wiring repair',
        status: 'pending_review'
      )
    end

    it 'starts in pending_review state for quotation services' do
      expect(booking.status).to eq('pending_review')
      expect(booking.pending_review?).to be true
    end

    it 'transitions from pending_review to contacting_provider' do
      expect(booking.can_transition_to?('contacting_provider')).to be true
      booking.transition_to!('contacting_provider', changed_by: admin, notes: 'Contacting electrician')
      expect(booking.reload.status).to eq('contacting_provider')
      expect(booking.contacting_provider?).to be true

      history = StatusHistory.for_entity('Booking', booking.id).last
      expect(history.previous_status).to eq('pending_review')
      expect(history.new_status).to eq('contacting_provider')
      expect(history.changed_by).to eq(admin.id)
      expect(history.notes).to eq('Contacting electrician')
    end

    it 'transitions through service lifecycle to completed' do
      booking.transition_to!('confirmed')
      expect(booking.confirmed?).to be true
      expect(booking.can_reschedule?).to be true

      booking.transition_to!('in_progress')
      expect(booking.in_progress?).to be true

      booking.transition_to!('completed')
      expect(booking.completed?).to be true
      expect(booking.can_transition_to?('in_progress')).to be false
    end

    it 'allows rescheduling and cancellation' do
      booking.transition_to!('confirmed')
      expect(booking.can_cancel?).to be true

      booking.transition_to!('rescheduled')
      expect(booking.rescheduled?).to be true

      booking.transition_to!('cancelled', changed_by: customer, notes: 'Customer cancelled')
      expect(booking.cancelled?).to be true
    end

    it 'raises InvalidTransitionError for invalid transitions' do
      expect do
        booking.transition_to!('completed')
      end.to raise_error(InvalidTransitionError)
    end
  end
end
