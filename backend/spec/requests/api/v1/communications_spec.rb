require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Communications', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:admin) { create(:user, :admin) }
  let(:category) { create(:category) }
  let(:service) { create(:service, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:service_request) { create(:service_request, user: customer, service: service, address: address) }

  describe 'Admin records communication for request' do
    it 'records outbound phone call and outcome' do
      params = {
        channel: 'phone',
        direction: 'outbound',
        summary: 'Called customer to confirm water leakage severity',
        outcome: 'Customer confirmed leakage is active, prefers technician tomorrow 10am'
      }

      post "/api/v1/admin/service_requests/#{service_request.id}/communications", params: params, headers: auth_headers(admin)
      expect(response).to have_http_status(:created)
      expect(json_response[:channel]).to eq('phone')
      expect(json_response[:direction]).to eq('outbound')
      expect(json_response[:summary]).to include('Called customer')
    end

    it 'records outbound WhatsApp communication' do
      params = {
        channel: 'whatsapp',
        direction: 'outbound',
        summary: 'Sent prefilled WhatsApp message regarding provider availability',
        outcome: 'Customer replied agreeing to quotation estimate'
      }

      post "/api/v1/admin/service_requests/#{service_request.id}/communications", params: params, headers: auth_headers(admin)
      expect(response).to have_http_status(:created)
      expect(json_response[:channel]).to eq('whatsapp')
    end

    it 'strictly forbids customers from accessing admin communication endpoint' do
      params = { channel: 'phone', direction: 'inbound', summary: 'Customer direct attempt' }
      post "/api/v1/admin/service_requests/#{service_request.id}/communications", params: params, headers: auth_headers(customer)
      expect(response).to have_http_status(:forbidden)
      expect(json_response[:error]).to eq('Admin access required')
    end
  end
end
