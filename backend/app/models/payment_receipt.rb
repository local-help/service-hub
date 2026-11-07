# frozen_string_literal: true

# == Schema Information
#
# Table name: payment_receipts
#
#  id                   :bigint           not null, primary key
#  document_storage_key :string
#  emailed_at           :datetime
#  generated_at         :datetime         not null
#  last_emailed_to      :string
#  receipt_data         :jsonb            not null
#  receipt_number       :string           not null
#  status               :string           default("issued"), not null
#  void_reason          :text
#  voided_at            :datetime
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  booking_id           :bigint           not null
#  original_receipt_id  :bigint
#  payment_id           :bigint           not null
#  reissued_receipt_id  :bigint
#
# Indexes
#
#  index_payment_receipts_on_booking_id           (booking_id)
#  index_payment_receipts_on_original_receipt_id  (original_receipt_id)
#  index_payment_receipts_on_payment_id           (payment_id) UNIQUE
#  index_payment_receipts_on_receipt_number       (receipt_number) UNIQUE
#  index_payment_receipts_on_status               (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (payment_id => payments.id)
#
class PaymentReceipt < ApplicationRecord
  STATUSES = %w[issued voided].freeze

  belongs_to :payment
  belongs_to :booking
  belongs_to :original_receipt, class_name: 'PaymentReceipt', optional: true
  has_one :reissued_receipt, class_name: 'PaymentReceipt', foreign_key: :original_receipt_id, dependent: :nullify

  validates :payment_id, presence: true, uniqueness: true
  validates :booking_id, presence: true
  validates :receipt_number, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :generated_at, presence: true
  validates :receipt_data, presence: true

  scope :issued, -> { where(status: 'issued') }
  scope :voided, -> { where(status: 'voided') }
  scope :recent, -> { order(generated_at: :desc) }

  before_validation :set_defaults, on: :create

  def issued?
    status == 'issued'
  end

  def voided?
    status == 'voided'
  end

  def void!(reason:)
    raise StandardError, 'Receipt is already voided' if voided?

    update!(
      status: 'voided',
      voided_at: Time.current,
      void_reason: reason
    )
  end

  def file_path
    return nil unless document_storage_key.present?

    storage_dir = Rails.root.join('storage', 'receipts')
    storage_dir.join(document_storage_key)
  end

  def pdf_content
    path = file_path
    return nil unless path && File.exist?(path)

    File.binread(path)
  end

  def total_amount
    receipt_data.dig('breakdown', 'total_amount').to_f
  end

  def payment_method
    receipt_data.dig('payment', 'method')
  end

  def payment_reference
    receipt_data.dig('payment', 'reference') || receipt_data.dig('payment', 'transaction_id')
  end

  def customer_name
    receipt_data.dig('customer', 'name')
  end

  def customer_email
    receipt_data.dig('customer', 'email')
  end

  def service_name
    receipt_data.dig('service', 'name')
  end

  private

  def set_defaults
    self.generated_at ||= Time.current
    self.status ||= 'issued'
    self.receipt_data ||= {}
  end
end
