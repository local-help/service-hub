# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentReceipt, type: :model do
  describe 'validations & associations' do
    subject { build(:payment_receipt) }

    it { is_expected.to belong_to(:payment) }
    it { is_expected.to belong_to(:booking) }
    it { is_expected.to validate_presence_of(:payment_id) }
    it { is_expected.to validate_presence_of(:booking_id) }
    it { is_expected.to validate_presence_of(:receipt_number) }
    it { is_expected.to validate_uniqueness_of(:payment_id) }
    it { is_expected.to validate_uniqueness_of(:receipt_number) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[issued voided]) }

    it 'enforces one receipt per payment at the database constraint level' do
      receipt = create(:payment_receipt)
      duplicate = build(:payment_receipt, payment: receipt.payment, booking: receipt.booking)
      expect { duplicate.save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe 'snapshot accessors' do
    let(:receipt) do
      create(:payment_receipt, receipt_data: {
        'breakdown' => { 'total_amount' => 1250.50 },
        'payment' => { 'method' => 'online', 'reference' => 'pay_xyz789' },
        'customer' => { 'name' => 'Amit Verma', 'email' => 'amit@example.com' },
        'service' => { 'name' => 'Deep Cleaning' }
      })
    end

    it 'extracts snapshot attributes accurately' do
      expect(receipt.total_amount).to eq(1250.50)
      expect(receipt.payment_method).to eq('online')
      expect(receipt.payment_reference).to eq('pay_xyz789')
      expect(receipt.customer_name).to eq('Amit Verma')
      expect(receipt.customer_email).to eq('amit@example.com')
      expect(receipt.service_name).to eq('Deep Cleaning')
    end
  end

  describe '#void!' do
    let(:receipt) { create(:payment_receipt) }

    it 'marks receipt as voided with reason and timestamp' do
      expect(receipt).to be_issued
      receipt.void!(reason: 'Chargeback disputed')
      expect(receipt.reload).to be_voided
      expect(receipt.void_reason).to eq('Chargeback disputed')
      expect(receipt.voided_at).to be_present
    end

    it 'raises error when attempting to void an already voided receipt' do
      receipt.void!(reason: 'First void')
      expect { receipt.void!(reason: 'Second void') }.to raise_error(StandardError, /already voided/)
    end
  end
end

