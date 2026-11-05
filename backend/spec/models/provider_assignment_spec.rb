# frozen_string_literal: true

# == Schema Information
#
# Table name: provider_assignments
#
#  id                 :bigint           not null, primary key
#  accepted_at        :datetime
#  assigned_at        :datetime         not null
#  completed_at       :datetime
#  internal_notes     :text
#  rejected_at        :datetime
#  rejection_reason   :text
#  status             :string           default("assigned"), not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  assigned_by_id     :bigint           not null
#  booking_id         :bigint
#  provider_id        :bigint           not null
#  service_request_id :bigint
#
# Indexes
#
#  index_provider_assignments_on_booking_id          (booking_id)
#  index_provider_assignments_on_provider_id         (provider_id)
#  index_provider_assignments_on_service_request_id  (service_request_id)
#  index_provider_assignments_on_status              (status)
#
# Foreign Keys
#
#  fk_rails_...  (assigned_by_id => users.id)
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
require 'rails_helper'

RSpec.describe ProviderAssignment, type: :model do
  let(:customer) { create(:user) }
  let(:admin) { create(:user, :admin) }
  let(:provider) { create(:provider) }
  let(:category) { create(:category) }
  let(:service) { create(:service, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:service_request) do
    ServiceRequest.create!(
      user: customer,
      service: service,
      address: address,
      description: 'Plumbing leak'
    )
  end

  describe 'AASM states and transitions' do
    let(:assignment) do
      ProviderAssignment.create!(
        service_request: service_request,
        provider: provider,
        assigned_by: admin,
        assigned_at: Time.current,
        status: 'assigned'
      )
    end

    it 'starts in assigned state' do
      expect(assignment.assigned?).to be true
      expect(assignment.can_accept?).to be true
      expect(assignment.can_reject?).to be true
    end

    it 'accepts assignment and updates accepted_at' do
      assignment.accept!(notes: 'Accepted by provider on call')
      expect(assignment.reload.accepted?).to be true
      expect(assignment.accepted_at).to be_present
      expect(assignment.internal_notes).to eq('Accepted by provider on call')

      history = StatusHistory.for_entity('ProviderAssignment', assignment.id).last
      expect(history.previous_status).to eq('assigned')
      expect(history.new_status).to eq('accepted')
    end

    it 'rejects assignment with a required reason' do
      expect do
        assignment.reject!(reason: '')
      end.to raise_error(ArgumentError, /reason is required/i)

      assignment.reject!(reason: 'Technician on sick leave')
      expect(assignment.reload.rejected?).to be true
      expect(assignment.rejection_reason).to eq('Technician on sick leave')
    end

    it 'progresses from accepted to in_progress and completed' do
      assignment.accept!
      expect(assignment.can_start?).to be true

      assignment.start_service!(notes: 'Repair started')
      expect(assignment.reload.in_progress?).to be true
      expect(assignment.can_complete?).to be true

      assignment.complete!(notes: 'Leak fixed and tested')
      expect(assignment.reload.completed?).to be true
      expect(assignment.completed_at).to be_present
    end
  end
end
