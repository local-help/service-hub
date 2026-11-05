# frozen_string_literal: true

# == Schema Information
#
# Table name: quotations
#
#  id                        :bigint           not null, primary key
#  amount                    :decimal(10, 2)   not null
#  created_by                :bigint           not null
#  description               :text
#  estimated_completion_time :string
#  reviewed_at               :datetime
#  status                    :string           default("pending"), not null
#  valid_until               :datetime         not null
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  booking_id                :bigint
#  provider_assignment_id    :bigint
#  provider_id               :bigint
#  reviewed_by_id            :bigint
#  service_request_id        :bigint
#
# Indexes
#
#  index_quotations_on_active_per_request      (service_request_id) UNIQUE WHERE ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'pending'::character varying, 'approved'::character varying])::text[]))
#  index_quotations_on_booking_id              (booking_id)
#  index_quotations_on_provider_assignment_id  (provider_assignment_id)
#  index_quotations_on_provider_id             (provider_id)
#  index_quotations_on_status                  (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (provider_assignment_id => provider_assignments.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (reviewed_by_id => users.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
require 'rails_helper'

RSpec.describe Quotation, type: :model do
  let(:customer) { create(:user) }
  let(:provider) { create(:provider) }
  let(:provider_user) { create(:user, :provider) }
  let(:category) { create(:category) }
  let(:service) { create(:service, :quotation_based, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:service_request) do
    ServiceRequest.create!(
      user: customer,
      service: service,
      address: address,
      description: 'Sofa deep clean'
    )
  end

  describe 'AASM states and transitions' do
    let(:quotation) do
      Quotation.create!(
        service_request: service_request,
        provider: provider,
        created_by: provider_user.id,
        amount: 850.0,
        valid_until: 3.days.from_now,
        status: 'pending'
      )
    end

    it 'initializes in pending state' do
      expect(quotation.pending?).to be true
      expect(quotation.can_approve?).to be true
      expect(quotation.can_reject?).to be true
    end

    it 'approves a pending quotation and logs history' do
      quotation.approve!(changed_by: customer)
      expect(quotation.reload.approved?).to be true
      expect(quotation.reviewed_by).to eq(customer)
      expect(quotation.reviewed_at).to be_present

      history = StatusHistory.for_entity('Quotation', quotation.id).last
      expect(history.previous_status).to eq('pending')
      expect(history.new_status).to eq('approved')
      expect(history.changed_by).to eq(customer.id)
    end

    it 'rejects a pending quotation and logs history' do
      quotation.reject!(changed_by: customer, reason: 'Price too high')
      expect(quotation.reload.rejected?).to be true
      expect(quotation.reviewed_by).to eq(customer)

      history = StatusHistory.for_entity('Quotation', quotation.id).last
      expect(history.previous_status).to eq('pending')
      expect(history.new_status).to eq('rejected')
      expect(history.notes).to eq('Price too high')
    end

    it 'prevents approval of an expired quotation' do
      quotation.update_column(:valid_until, 1.hour.ago)
      expect(quotation.expired?).to be true
      expect(quotation.can_approve?).to be false

      expect do
        quotation.approve!(changed_by: customer)
      end.to raise_error(AASM::InvalidTransition)
    end

    it 'allows withdrawing a quotation' do
      quotation.withdraw!(by_user: provider_user, reason: 'Parts unavailable')
      expect(quotation.reload.withdrawn?).to be true

      history = StatusHistory.for_entity('Quotation', quotation.id).last
      expect(history.new_status).to eq('withdrawn')
      expect(history.notes).to eq('Parts unavailable')
    end
  end
end
