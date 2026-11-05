require 'rails_helper'

RSpec.describe 'Api::V1::Addresses', type: :request do
  let(:customer1) { create(:user) }
  let(:customer2) { create(:user) }
  let!(:addr1) { create(:address, user: customer1, address_line: '100 Victoria Road', is_default: true) }
  let!(:addr2) { create(:address, user: customer2, address_line: '200 MG Road') }

  describe 'GET /api/v1/addresses' do
    it 'returns only addresses belonging to the authenticated user' do
      get '/api/v1/addresses', headers: auth_headers(customer1)
      expect(response).to have_http_status(:ok)
      expect(json_response.length).to eq(1)
      expect(json_response.first[:id]).to eq(addr1.id)
    end
  end

  describe 'POST /api/v1/addresses' do
    it 'creates an address for the authenticated user' do
      params = {
        label: 'Office',
        address_line: 'Civil Lines Plaza',
        city: 'Prayagraj',
        state: 'Uttar Pradesh',
        postal_code: '211001',
        is_default: true
      }
      post '/api/v1/addresses', params: params, headers: auth_headers(customer1)
      expect(response).to have_http_status(:created)
      expect(json_response[:label]).to eq('Office')
      expect(customer1.addresses.count).to eq(2)
      # Previous address should no longer be default
      expect(addr1.reload.is_default).to eq(false)
    end
  end

  describe 'Security: Accessing another user address' do
    it 'denies access to other users address' do
      get "/api/v1/addresses/#{addr2.id}", headers: auth_headers(customer1)
      expect(response).to have_http_status(:not_found)
    end
  end
end
