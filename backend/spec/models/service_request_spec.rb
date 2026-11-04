require 'rails_helper'

RSpec.describe ServiceRequest, type: :model do
  let(:customer) { create(:user) }
  let(:category) { create(:category) }
  let(:service) { create(:service, category: category) }
  let(:address) { create(:address, user: customer) }

  it 'generates a unique reference number formatted as LH-XXXXX' do
    req = ServiceRequest.create!(
      user: customer,
      service: service,
      address: address,
      description: 'Air conditioning not cooling'
    )
    expect(req.reference_number).to match(/\ALH-\d{5}\z/)
    expect(req.status).to eq('pending_review')
  end

  it 'enforces valid state machine transitions' do
    req = create(:service_request, user: customer, service: service, address: address)
    expect(req.status).to eq('pending_review')

    # Allowed transition
    req.transition_to!('contacting_provider')
    expect(req.status).to eq('contacting_provider')

    # Invalid transition (e.g., jump straight to completed)
    expect {
      req.transition_to!('completed')
    }.to raise_error(InvalidTransitionError)
  end

  it 'records status history when status transitions' do
    req = create(:service_request, user: customer, service: service, address: address)
    admin = create(:user, :admin)

    req.transition_to!('contacting_provider', changed_by: admin, notes: 'Contacted provider Apex')
    history = StatusHistory.for_entity('ServiceRequest', req.id).last
    expect(history.previous_status).to eq('pending_review')
    expect(history.new_status).to eq('contacting_provider')
    expect(history.changed_by).to eq(admin.id)
    expect(history.notes).to eq('Contacted provider Apex')
  end
end

