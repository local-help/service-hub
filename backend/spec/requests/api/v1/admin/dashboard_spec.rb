require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Dashboard', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:admin) { create(:user, :admin) }

  describe 'GET /api/v1/admin/dashboard' do
    it 'returns metrics overview for admin' do
      get '/api/v1/admin/dashboard', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json_response[:metrics]).to be_present
      expect(json_response[:metrics]).to have_key(:total_requests)
      expect(json_response[:metrics]).to have_key(:pending_review)
      expect(json_response[:metrics]).to have_key(:total_revenue)
    end

    it 'denies access to non-admin customers' do
      get '/api/v1/admin/dashboard', headers: auth_headers(customer)
      expect(response).to have_http_status(:forbidden)
      expect(json_response[:error]).to eq('Admin access required')
    end
  end
end

