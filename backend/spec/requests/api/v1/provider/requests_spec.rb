require 'rails_helper'

RSpec.describe 'Provider Portal API', type: :request do
  let(:super_admin) { create(:user, :super_admin) }
  let(:customer) { create(:user, role: 'customer') }

  let(:provider_a) { create(:provider, name: 'Apex Detailing') }
  let(:user_a) { create(:user, role: 'provider') }
  let!(:provider_user_a) { create(:provider_user, user: user_a, provider: provider_a, role: 'owner') }

  let(:provider_b) { create(:provider, name: 'SparklePro Cleaning') }
  let(:user_b) { create(:user, role: 'provider') }
  let!(:provider_user_b) { create(:provider_user, user: user_b, provider: provider_b, role: 'owner') }

  let(:category) { create(:category) }
  let(:service) { create(:service, category: category, pricing_type: 'quotation', fixed_price: nil) }
  let(:address) { create(:address, user: customer) }

  let(:request_a) do
    sr = create(:service_request, user: customer, service: service, address: address, status: 'contacting_provider')
    create(:provider_assignment, service_request: sr, provider: provider_a, assigned_by: super_admin, status: 'assigned')
    sr
  end

  let(:request_b) do
    sr = create(:service_request, user: customer, service: service, address: address, status: 'contacting_provider')
    create(:provider_assignment, service_request: sr, provider: provider_b, assigned_by: super_admin, status: 'assigned')
    sr
  end

  describe 'GET /api/v1/provider/dashboard' do
    it 'returns provider metrics and recent assignments for current provider' do
      assignment_a = request_a.provider_assignments.first

      get '/api/v1/provider/dashboard', headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['provider']['id']).to eq(provider_a.id)
      expect(json['stats']['pending_assignments_count']).to eq(1)
      expect(json['recent_assignments'].first['id']).to eq(assignment_a.id)
    end
  end

  describe 'GET /api/v1/provider/requests' do
    it 'lists only assignments belonging to the authenticated provider' do
      assignment_a = request_a.provider_assignments.first
      assignment_b = request_b.provider_assignments.first

      get '/api/v1/provider/requests', headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      assigned_ids = json.map { |item| item['id'] }

      expect(assigned_ids).to include(assignment_a.id)
      expect(assigned_ids).not_to include(assignment_b.id)
    end
  end

  describe 'Data isolation & IDOR protection' do
    it 'returns 404 when Provider A tries to view Provider B assignment' do
      assignment_b = request_b.provider_assignments.first

      get "/api/v1/provider/requests/#{assignment_b.id}", headers: auth_headers(user_a)

      expect(response).to have_http_status(:not_found)
    end

    it 'returns 404 when Provider A tries to accept Provider B assignment' do
      assignment_b = request_b.provider_assignments.first

      post "/api/v1/provider/requests/#{assignment_b.id}/accept", headers: auth_headers(user_a)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'Assignment lifecycle' do
    let(:assignment_a) { request_a.provider_assignments.first }

    it 'allows provider to accept assignment' do
      post "/api/v1/provider/requests/#{assignment_a.id}/accept",
           params: { notes: 'Accepted, on the way' },
           headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('accepted')
      expect(assignment_a.reload.status).to eq('accepted')
    end

    it 'requires rejection reason when rejecting' do
      post "/api/v1/provider/requests/#{assignment_a.id}/reject",
           params: { reason: '' },
           headers: auth_headers(user_a)

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['error']).to match(/reason is required/i)
    end

    it 'allows provider to reject assignment with valid reason' do
      post "/api/v1/provider/requests/#{assignment_a.id}/reject",
           params: { reason: 'Fully booked today' },
           headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      expect(assignment_a.reload.status).to eq('rejected')
      expect(assignment_a.rejection_reason).to eq('Fully booked today')
    end

    it 'allows provider to submit quotation' do
      assignment_a.update!(status: 'accepted')

      post "/api/v1/provider/requests/#{assignment_a.id}/quotations",
           params: { amount: 1200.0, description: 'Complete exterior and interior treatment' },
           headers: auth_headers(user_a)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['amount']).to eq(1200.0)
      expect(request_a.reload.status).to eq('quotation_sent')
    end

    it 'allows provider to update service progress' do
      assignment_a.update!(status: 'accepted')

      # Start service
      patch "/api/v1/provider/requests/#{assignment_a.id}/status",
            params: { status: 'in_progress', notes: 'Vehicle wash started' },
            headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      expect(assignment_a.reload.status).to eq('in_progress')

      # Complete service
      patch "/api/v1/provider/requests/#{assignment_a.id}/status",
            params: { status: 'completed', notes: 'Service done' },
            headers: auth_headers(user_a)

      expect(response).to have_http_status(:ok)
      expect(assignment_a.reload.status).to eq('completed')
    end
  end

  describe 'Suspended provider' do
    let(:suspended_provider) { create(:provider, :suspended) }
    let(:suspended_user) { create(:user, role: 'provider') }
    let!(:suspended_pu) { create(:provider_user, user: suspended_user, provider: suspended_provider, role: 'owner') }

    it 'denies access to suspended provider' do
      get '/api/v1/provider/dashboard', headers: auth_headers(suspended_user)
      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['code']).to eq('PROVIDER_SUSPENDED')
    end
  end
end
