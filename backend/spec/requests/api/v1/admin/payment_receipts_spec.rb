# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::PaymentReceipts', type: :request do
  let(:admin) { create(:user, :admin) }
  let(:customer) { create(:user) }
  let(:booking) { create(:booking, user: customer, total_amount: 750.0) }
  let(:payment) { create(:payment, :paid, booking: booking, amount: 750.0, gateway_reference: 'pay_admin_txn_999') }
  let!(:receipt) { create(:payment_receipt, payment: payment, booking: booking, receipt_number: 'LH-REC-20261107-ADM001') }

  describe 'GET /api/v1/admin/payment_receipts' do
    it 'denies access to non-admin customers' do
      get '/api/v1/admin/payment_receipts', headers: auth_headers(customer)
      expect(response).to have_http_status(:forbidden)
    end

    it 'lists receipts with pagination for administrators' do
      get '/api/v1/admin/payment_receipts', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to be >= 1
    end

    it 'filters receipts by search query matching receipt number' do
      get '/api/v1/admin/payment_receipts?search=ADM001', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json_response.first[:receipt_number]).to eq('LH-REC-20261107-ADM001')
    end

    it 'filters receipts by status' do
      get '/api/v1/admin/payment_receipts?status=voided', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json_response).to be_empty
    end
  end

  describe 'GET /api/v1/admin/payment_receipts/:id' do
    it 'returns full receipt details with immutable snapshot' do
      get "/api/v1/admin/payment_receipts/#{receipt.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json_response[:receipt_number]).to eq('LH-REC-20261107-ADM001')
      expect(json_response[:receipt_data]).to be_present
    end
  end

  describe 'GET /api/v1/admin/payment_receipts/:id/download' do
    it 'streams receipt PDF for admin download' do
      get "/api/v1/admin/payment_receipts/#{receipt.id}/download", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to eq('application/pdf')
      expect(response.headers['Content-Disposition']).to include('Receipt_LH-REC-20261107-ADM001.pdf')
      expect(response.body.bytesize).to be > 1000
    end
  end

  describe 'POST /api/v1/admin/payment_receipts/:id/void' do
    it 'voids the receipt and logs activity' do
      expect {
        post "/api/v1/admin/payment_receipts/#{receipt.id}/void",
             params: { reason: 'Incorrect customer billing entity' },
             headers: auth_headers(admin)
      }.to change(AdminActivityLog, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(json_response[:status]).to eq('voided')
      expect(json_response[:void_reason]).to eq('Incorrect customer billing entity')
      expect(receipt.reload.voided?).to be true

      log = AdminActivityLog.last
      expect(log.action).to eq('void_receipt')
      expect(log.admin_user_id).to eq(admin.id)
    end
  end
end
