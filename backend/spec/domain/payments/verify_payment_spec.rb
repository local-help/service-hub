# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Payments::VerifyPayment do
  let(:user) { create(:user) }
  let(:booking) { create(:booking, user: user) }
  let(:order_id) { 'order_test_999' }
  let(:gateway_ref) { 'pay_test_ref_123' }
  let!(:payment) do
    create(:payment, booking: booking, amount: 650.00, gateway_order_id: order_id, status: 'pending')
  end

  describe '#call' do
    context 'when RAZORPAY_KEY_SECRET is configured' do
      let(:secret) { 'test_razorpay_secret_key' }
      let(:payload) { "#{order_id}|#{gateway_ref}" }
      let(:valid_signature) { OpenSSL::HMAC.hexdigest('sha256', secret, payload) }

      around do |example|
        original = ENV.fetch('RAZORPAY_KEY_SECRET', nil)
        ENV['RAZORPAY_KEY_SECRET'] = secret
        example.run
      ensure
        ENV['RAZORPAY_KEY_SECRET'] = original
      end

      it 'successfully verifies payment with a valid HMAC signature' do
        result = described_class.call(
          booking: booking,
          gateway_order_id: order_id,
          gateway_reference: gateway_ref,
          signature: valid_signature
        )

        expect(result).to eq(payment)
        expect(payment.reload.status).to eq('paid')
        expect(payment.gateway_reference).to eq(gateway_ref)
        expect(payment.gateway_metadata['razorpay_signature']).to eq(valid_signature)
      end

      it 'raises DomainError when signature is missing' do
        expect do
          described_class.call(
            booking: booking,
            gateway_order_id: order_id,
            gateway_reference: gateway_ref,
            signature: nil
          )
        end.to raise_error(DomainError, /Payment signature is required/)
      end

      it 'raises DomainError when signature is invalid' do
        expect do
          described_class.call(
            booking: booking,
            gateway_order_id: order_id,
            gateway_reference: gateway_ref,
            signature: 'tampered_signature_string'
          )
        end.to raise_error(DomainError, /Invalid payment signature verification/)
      end
    end

    context 'when payment is already paid (idempotency)' do
      before do
        payment.update!(status: 'paid', gateway_reference: gateway_ref)
      end

      it 'returns the existing paid payment without error' do
        result = described_class.call(
          booking: booking,
          gateway_order_id: order_id,
          gateway_reference: gateway_ref,
          signature: 'any_sig'
        )

        expect(result.id).to eq(payment.id)
        expect(result.status).to eq('paid')
      end
    end

    context 'when payment record is not found' do
      it 'raises ActiveRecord::RecordNotFound' do
        expect do
          described_class.call(
            booking: booking,
            gateway_order_id: 'non_existent_order',
            gateway_reference: gateway_ref
          )
        end.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
