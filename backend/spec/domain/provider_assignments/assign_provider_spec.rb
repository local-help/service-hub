# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProviderAssignments::AssignProvider do
  let(:admin) { create(:user, :admin) }
  let(:provider) { create(:provider) }
  let(:service_request) { create(:service_request) }
  let!(:booking) { create(:booking, service_request: service_request) }

  describe '#call' do
    context 'when target has both service_request and booking' do
      it 'synchronously assigns provider to both service_request and booking' do
        assignment = described_class.call(
          target: service_request,
          provider: provider,
          assigned_by: admin,
          notes: 'Assigned to leading local technician'
        )

        expect(assignment).to be_persisted
        expect(assignment.provider).to eq(provider)
        expect(assignment.service_request).to eq(service_request)
        expect(assignment.booking).to eq(booking)

        expect(service_request.reload.provider).to eq(provider)
        expect(booking.reload.provider).to eq(provider)
        expect(booking.assigned_by).to eq(admin.id)
        expect(booking.assigned_at).to be_present
      end
    end

    context 'when target is a standalone booking' do
      let(:standalone_booking) { create(:booking, service_request: nil) }

      it 'assigns the provider and creates a provider_assignment for the booking' do
        assignment = described_class.call(
          target: standalone_booking,
          provider: provider,
          assigned_by: admin
        )

        expect(assignment).to be_persisted
        expect(standalone_booking.reload.provider).to eq(provider)
        expect(assignment.booking).to eq(standalone_booking)
        expect(assignment.service_request).to be_nil
      end
    end
  end
end
