# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Payments::GeneratePaymentReceipt do
  let(:user) { create(:user, name: 'Priya Sharma', email: 'priya@example.com') }
  let(:service) { create(:service, name: 'Sofa Cleaning', fixed_price: 699.0) }
  let(:booking) { create(:booking, user: user, service: service, total_amount: 699.0) }

  describe '#call' do
    context 'when payment is not paid' do
      let(:pending_payment) { create(:payment, booking: booking, status: 'pending') }

      it 'returns Failure(:payment_not_paid)' do
        result = described_class.call(payment: pending_payment)
        expect(result).to be_failure
        expect(result.failure.first).to eq(:payment_not_paid)
      end
    end

    context 'when payment is paid' do
      let(:payment) do
        create(:payment, :paid,
               booking: booking,
               amount: 699.0,
               gateway_reference: 'pay_rspec_success_123',
               gateway_order_id: 'order_rspec_123')
      end

      it 'generates a valid payment receipt with physical PDF' do
        result = described_class.call(payment: payment)
        expect(result).to be_success

        receipt = result.value!
        expect(receipt).to be_a(PaymentReceipt)
        expect(receipt.receipt_number).to start_with('LOCAL-')
        expect(receipt.total_amount).to eq(699.0)
        expect(receipt.customer_name).to eq('Priya Sharma')
        expect(receipt.file_path).to exist
        expect(receipt.pdf_content).to be_present
        expect(receipt.pdf_content.bytesize).to be > 5000
      end

      it 'is completely idempotent on multiple calls' do
        first_call = described_class.call(payment: payment)
        second_call = described_class.call(payment: payment)

        expect(first_call).to be_success
        expect(second_call).to be_success
        expect(first_call.value!.id).to eq(second_call.value!.id)
        expect(first_call.value!.receipt_number).to eq(second_call.value!.receipt_number)
        expect(PaymentReceipt.where(payment: payment).count).to eq(1)
      end

      it 're-renders missing physical PDF strictly from immutable snapshot if file is deleted' do
        receipt = described_class.call(payment: payment).value!
        file_path = receipt.file_path
        expect(File.exist?(file_path)).to be true

        # Delete physical file to simulate storage loss
        File.delete(file_path)
        expect(File.exist?(file_path)).to be false

        # Modify booking price dynamically in database
        booking.update_column(:total_amount, 9999.0)

        # Subsequent call must safely recreate file using original immutable snapshot
        retry_call = described_class.call(payment: payment)
        expect(retry_call).to be_success
        expect(File.exist?(file_path)).to be true
        expect(retry_call.value!.total_amount).to eq(699.0) # Original price preserved!
      end
    end
  end
end

