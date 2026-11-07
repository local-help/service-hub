# frozen_string_literal: true

class DeliverPaymentReceiptJob < ApplicationJob
  queue_as :default

  def perform(receipt_id, recipient_email = nil)
    receipt = PaymentReceipt.find_by(id: receipt_id)
    return unless receipt

    target_email = recipient_email.presence || receipt.booking.user&.email
    return unless target_email.present?

    # Deliver email with attached receipt PDF
    PaymentReceiptMailer.receipt_email(receipt, target_email).deliver_now

    receipt.update!(
      emailed_at: Time.current,
      last_emailed_to: target_email
    )

    Rails.logger.info("[DeliverPaymentReceiptJob] Receipt #{receipt.receipt_number} delivered to #{target_email}")
  rescue StandardError => e
    Rails.logger.error("[DeliverPaymentReceiptJob] Failed for receipt #{receipt_id}: #{e.message}")
    raise e
  end
end

