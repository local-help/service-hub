# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::PaymentReceipts', type: :request do
  include ActiveJob::TestHelper

  let(:customer) { create(:user, name: 'Customer One', email: 'cust1@example.com') }
  let(:other_customer) { create(:user, name: 'Customer Two', email: 'cust2@example.com') }
  let(:admin) { create(:user, :admin) }
  let(:provider_user) { create(:user, role: 'provider') }
  let(:provider) { create(:provider) }
  let!(:provider_link) { create(:provider_user, user: provider_user, provider: provider) }

  let(:service) { create(:service, name: 'Car Detailing', fixed_price: 525.0) }
  let(:booking) { create(:booking, user: customer, service: service, total_amount: 525.0, provider: provider) }

  describe 'GET /api/v1/bookings/:booking_id/receipt' do
    context 'unauthenticated' do
      it 'returns 401 unauthorized' do
        get "/api/v1/bookings/#{booking.id}/receipt"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when payment is not yet completed' do
      it 'returns 422 unprocessable entity' do
        get "/api/v1/bookings/#{booking.id}/receipt", headers: auth_headers(customer)
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response[:error]).to include('Receipts are only issued for paid bookings')
      end
    end

    context 'when payment is successfully completed' do
      let!(:payment) do
        create(:payment, :paid,
               booking: booking,
               amount: 525.0,
               gateway_reference: 'pay_complete_123',
               gateway_order_id: 'order_complete_123')
      end

      it 'streams PDF attachment by default' do
        get "/api/v1/bookings/#{booking.id}/receipt", headers: auth_headers(customer)
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to eq('application/pdf')
        expect(response.headers['Content-Disposition']).to include('attachment')
        expect(response.headers['Content-Disposition']).to include('LocalHelp_Receipt_')
        expect(response.body.bytesize).to be > 5000
      end

      it 'returns JSON receipt snapshot when requested via format=json' do
        get "/api/v1/bookings/#{booking.id}/receipt?format=json", headers: auth_headers(customer)
        expect(response).to have_http_status(:ok)
        expect(json_response[:receipt_number]).to start_with('LOCAL-')
        expect(json_response[:total_amount]).to eq(525.0)
        expect(json_response[:payment_reference]).to eq('pay_complete_123')
        expect(json_response[:status]).to eq('issued')
      end

      it 'allows administrators to access the customer receipt' do
        get "/api/v1/bookings/#{booking.id}/receipt?format=json", headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response[:total_amount]).to eq(525.0)
      end

      it 'denies another customer from accessing this receipt' do
        get "/api/v1/bookings/#{booking.id}/receipt", headers: auth_headers(other_customer)
        expect(response).to have_http_status(:forbidden)
      end

      it 'strictly isolates providers from accessing customer payment receipts' do
        # Even assigned providers cannot view the customer-facing platform payment receipt
        get "/api/v1/bookings/#{booking.id}/receipt", headers: auth_headers(provider_user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'POST /api/v1/bookings/:booking_id/receipt/request_email' do
    let!(:payment) do
      create(:payment, :paid,
             booking: booking,
             amount: 525.0,
             gateway_reference: 'pay_email_test_123')
    end

    it 'queues email delivery job and records email timestamp' do
      expect {
        post "/api/v1/bookings/#{booking.id}/receipt/request_email",
             headers: auth_headers(customer)
      }.to have_enqueued_job(DeliverPaymentReceiptJob)

      expect(response).to have_http_status(:ok)
      expect(json_response[:message]).to include('delivered to cust1@example.com')
      expect(json_response[:recipient_email]).to eq('cust1@example.com')

      receipt = PaymentReceipt.find_by(payment: payment)
      expect(receipt.emailed_at).to be_present
      expect(receipt.last_emailed_to).to eq('cust1@example.com')
    end

    it 'prevents duplicate emails when requested repeatedly within rate limit' do
      # First request
      post "/api/v1/bookings/#{booking.id}/receipt/request_email", headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)

      # Second immediate request
      expect {
        post "/api/v1/bookings/#{booking.id}/receipt/request_email", headers: auth_headers(customer)
      }.not_to have_enqueued_job(DeliverPaymentReceiptJob)

      expect(response).to have_http_status(:ok)
      expect(json_response[:already_sent]).to be true
      expect(json_response[:message]).to include('already emailed')
    end
  end
end

