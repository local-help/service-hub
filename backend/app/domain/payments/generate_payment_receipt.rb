# frozen_string_literal: true

require 'dry/monads'
require 'fileutils'

module Payments
  class GeneratePaymentReceipt
    include Callable
    extend Dry::Initializer
    include Dry::Monads[:result]

    option :payment, type: Types::Instance(Payment)

    STORAGE_DIR = Rails.root.join('storage', 'receipts')

    def call
      return Failure[:payment_not_paid, 'Receipt can only be generated for successful payments'] unless payment.paid?

      receipt = nil
      payment.with_lock do
        existing = payment.payment_receipt
        if existing.present?
          # Ensure physical PDF exists on disk from immutable snapshot if missing
          ensure_pdf_on_disk(existing)
          return Success(existing)
        end

        snapshot = BuildReceiptSnapshot.call(payment: payment)
        receipt_number = snapshot['receipt_number']
        storage_key = "receipt_#{receipt_number}_#{SecureRandom.hex(6)}.pdf"

        # Generate PDF binary
        pdf_bytes = GenerateReceiptPdf.call(receipt_data: snapshot)

        # Store document in private directory
        FileUtils.mkdir_p(STORAGE_DIR)
        file_path = STORAGE_DIR.join(storage_key)
        File.binwrite(file_path, pdf_bytes)

        receipt = PaymentReceipt.create!(
          payment: payment,
          booking: payment.booking,
          receipt_number: receipt_number,
          status: 'issued',
          receipt_data: snapshot,
          document_storage_key: storage_key,
          generated_at: Time.current
        )
      end

      Success(receipt)
    rescue ActiveRecord::RecordNotUnique
      # Concurrency fallback: reload payment and return the winning receipt
      payment.reload
      if payment.payment_receipt.present?
        ensure_pdf_on_disk(payment.payment_receipt)
        Success(payment.payment_receipt)
      else
        Failure[:concurrency_error, 'Receipt generation race condition encountered']
      end
    rescue StandardError => e
      Rails.logger.error("[GeneratePaymentReceipt] Failed for payment #{payment&.id}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
      Failure[:generation_failed, e.message]
    end

    private

    def ensure_pdf_on_disk(receipt)
      return if receipt.file_path && File.exist?(receipt.file_path)

      storage_key = receipt.document_storage_key.presence || "receipt_#{receipt.receipt_number}_#{SecureRandom.hex(6)}.pdf"
      FileUtils.mkdir_p(STORAGE_DIR)
      file_path = STORAGE_DIR.join(storage_key)

      pdf_bytes = GenerateReceiptPdf.call(receipt_data: receipt.receipt_data)
      File.binwrite(file_path, pdf_bytes)

      receipt.update_column(:document_storage_key, storage_key) if receipt.document_storage_key != storage_key
    end
  end
end

# Root-level constant alias for convention compatibility
GeneratePaymentReceipt = Payments::GeneratePaymentReceipt unless defined?(GeneratePaymentReceipt)

