require 'rails_helper'

RSpec.describe 'Api::V1::ServiceRequests', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:other_customer) { create(:user, role: 'customer') }
  let(:category) { create(:category) }
  let(:fixed_service) { create(:service, category: category, pricing_type: 'fixed_price', fixed_price: 499) }
  let(:quote_service) { create(:service, :quotation_based, category: category) }
  let(:address) { create(:address, user: customer) }

  describe 'POST /api/v1/service_requests' do
    it 'creates a quotation-based service request with LH-XXXXX reference' do
      params = {
        service_id: quote_service.id,
        address_id: address.id,
        description: 'Complete repaint of 2 bedroom walls'
      }

      post '/api/v1/service_requests', params: params, headers: auth_headers(customer)
      expect(response).to have_http_status(:created)
      expect(json_response[:reference_number]).to match(/\ALH-\d{5}\z/)
      expect(json_response[:status]).to eq('pending_review')
      expect(json_response[:service][:name]).to eq(quote_service.name)
    end

    it 'creates a fixed-price service request and immediately confirms booking' do
      params = {
        service_id: fixed_service.id,
        address_id: address.id,
        description: 'Need doorstep foam wash on Saturday'
      }

      post '/api/v1/service_requests', params: params, headers: auth_headers(customer)
      expect(response).to have_http_status(:created)
      expect(json_response[:status]).to eq('booking_confirmed')
      expect(json_response[:booking][:status]).to eq('confirmed')
    end
  end

  describe 'GET /api/v1/service_requests/:id' do
    let!(:req) { create(:service_request, user: customer, service: quote_service, address: address) }

    it 'allows owner customer to view their own request' do
      get "/api/v1/service_requests/#{req.id}", headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)
      expect(json_response[:id]).to eq(req.id)
    end

    it 'denies access to another customer' do
      get "/api/v1/service_requests/#{req.id}", headers: auth_headers(other_customer)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
