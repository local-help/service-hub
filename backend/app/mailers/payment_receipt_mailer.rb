# frozen_string_literal: true

class PaymentReceiptMailer < ApplicationMailer
  def receipt_email(receipt, recipient_email = nil)
    @receipt = receipt
    @booking = receipt.booking
    @user = @booking.user
    @to_email = recipient_email.presence || @user&.email
    return unless @to_email.present?

    @platform_name = PlatformSetting.get('platform_name', default: 'LocalHelp')
    @support_phone = PlatformSetting.get('support_phone', default: '+919876543210')
    @support_email = PlatformSetting.get('support_email', default: 'care@localhelp.in')

    pdf_data = @receipt.pdf_content
    if pdf_data.present?
      attachments["Payment_Receipt_#{@receipt.receipt_number}.pdf"] = {
        mime_type: 'application/pdf',
        content: pdf_data
      }
    end

    mail(
      to: @to_email,
      subject: "Payment Receipt: #{@receipt.receipt_number} – #{@booking.service&.name || 'LocalHelp Service'}"
    )
  end
end

