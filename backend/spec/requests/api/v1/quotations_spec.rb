require 'rails_helper'

RSpec.describe 'Api::V1::Quotations', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:other_customer) { create(:user, role: 'customer') }
  let(:admin) { create(:user, :admin) }
  let(:category) { create(:category) }
  let(:service) { create(:service, :quotation_based, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:service_request) { create(:service_request, user: customer, service: service, address: address) }

  describe 'Admin creates quotation' do
    it 'creates one quotation and transitions request to quotation_sent' do
      params = {
        amount: 850.00,
        description: 'Includes copper pipe replacement and labour',
        valid_until: 2.days.from_now.iso8601
      }

      post "/api/v1/admin/quotations/#{service_request.id}", params: params, headers: auth_headers(admin)
      expect(response).to have_http_status(:created)
      expect(json_response[:amount]).to eq(850.00)
      expect(json_response[:status]).to eq('pending')
      expect(service_request.reload.status).to eq('quotation_sent')
    end

    it 'strictly rejects a second quotation for the same service request' do
      create(:quotation, service_request: service_request, creator: admin)

      params = { amount: 999.00, description: 'Duplicate quotation' }
      post "/api/v1/admin/quotations/#{service_request.id}", params: params, headers: auth_headers(admin)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response[:error]).to include('already exists')
    end
  end

  describe 'Customer approves and rejects quotation' do
    let!(:quotation) { create(:quotation, service_request: service_request, creator: admin, amount: 1200) }

    before do
      service_request.update!(status: 'quotation_sent')
    end

    it 'allows the request owner to approve quotation and auto-confirms booking' do
      post "/api/v1/service_requests/#{service_request.id}/quotation/approve", headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)
      expect(quotation.reload.status).to eq('approved')
      expect(service_request.reload.status).to eq('booking_confirmed')
      expect(service_request.booking.status).to eq('confirmed')
    end

    it 'denies another customer from approving quotation' do
      post "/api/v1/service_requests/#{service_request.id}/quotation/approve", headers: auth_headers(other_customer)
      expect(response).to have_http_status(:forbidden)
    end

    it 'allows owner to reject quotation' do
      post "/api/v1/service_requests/#{service_request.id}/quotation/reject", headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)
      expect(quotation.reload.status).to eq('rejected')
      expect(service_request.reload.status).to eq('quotation_rejected')
    end
  end
end

