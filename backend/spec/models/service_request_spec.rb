# == Schema Information
#
# Table name: service_requests
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text             not null
#  duration_hours      :integer
#  preferred_at        :datetime
#  reference_number    :string           not null
#  selected_options    :jsonb
#  status              :string           default("pending_review"), not null
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint           not null
#  provider_id         :bigint
#  service_id          :bigint           not null
#  service_variant_id  :bigint
#  user_id             :bigint           not null
#
# Indexes
#
#  index_service_requests_on_address_id          (address_id)
#  index_service_requests_on_preferred_at        (preferred_at)
#  index_service_requests_on_provider_id         (provider_id)
#  index_service_requests_on_reference_number    (reference_number) UNIQUE
#  index_service_requests_on_service_id          (service_id)
#  index_service_requests_on_service_variant_id  (service_variant_id)
#  index_service_requests_on_status              (status)
#  index_service_requests_on_user_id             (user_id)
#  index_service_requests_on_user_id_and_status  (user_id,status)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (assigned_by => users.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
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
    expect do
      req.transition_to!('completed')
    end.to raise_error(InvalidTransitionError)
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
