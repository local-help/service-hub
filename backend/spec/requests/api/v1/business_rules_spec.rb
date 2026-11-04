require 'rails_helper'

RSpec.describe 'Core Business Rules & Constraints', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:admin) { create(:user, :admin) }
  let(:category) { create(:category) }
  let(:service) { create(:service, :quotation_based, category: category) }
  let(:address) { create(:address, user: customer) }
  let(:service_request) { create(:service_request, user: customer, service: service, address: address) }

  describe 'Rule 8: Expired or rejected quotation cannot confirm a booking' do
    it 'rejects approval of an expired quotation' do
      quotation = create(:quotation, service_request: service_request, creator: admin)
      quotation.update_column(:valid_until, 1.day.ago)
      service_request.update!(status: 'quotation_sent')

      post "/api/v1/service_requests/#{service_request.id}/quotation/approve", headers: auth_headers(customer)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response[:error]).to include('expired')
    end

    it 'rejects approval of an already rejected quotation' do
      quotation = create(:quotation, service_request: service_request, creator: admin, status: 'rejected')
      service_request.update!(status: 'quotation_rejected')

      post "/api/v1/service_requests/#{service_request.id}/quotation/approve", headers: auth_headers(customer)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response[:error]).to include('cannot be approved')
    end
  end

  describe 'Rule 11: Inactive providers cannot be assigned to new requests' do
    it 'raises error when attempting to assign an inactive provider' do
      inactive_provider = create(:provider, active: false)

      post "/api/v1/admin/service_requests/#{service_request.id}/assign_provider",
           params: { provider_id: inactive_provider.id },
           headers: auth_headers(admin)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'Rule 9: Payment verification idempotency' do
    let(:booking) { create(:booking, service_request: service_request) }
    let!(:payment) { create(:payment, booking: booking, amount: 800, gateway_order_id: 'order_test_123', status: 'pending') }

    it 'processes verification idempotently without creating duplicate records' do
      verify_params = {
        gateway_order_id: 'order_test_123',
        gateway_reference: 'pay_test_999'
      }

      # First call
      post "/api/v1/bookings/#{booking.id}/payments/verify", params: verify_params, headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)
      expect(payment.reload.status).to eq('paid')

      # Duplicate second call
      post "/api/v1/bookings/#{booking.id}/payments/verify", params: verify_params, headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)
      expect(booking.payments.count).to eq(1)
    end
  end
end
