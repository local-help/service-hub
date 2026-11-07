# frozen_string_literal: true

module Api
  module V1
    class PaymentReceiptsController < ApplicationController
      before_action :authenticate_user!

      def show
        booking = Booking.find(params[:booking_id])
        authorize_booking_access!(booking)

        payment = booking.payments.where(status: 'paid').order(created_at: :desc).first
        unless payment
          return render json: { error: 'No successful payment found for this booking. Receipts are only issued for paid bookings.' }, status: :unprocessable_entity
        end

        result = Payments::GeneratePaymentReceipt.call(payment: payment)
        unless result.success?
          error_msg = result.failure.is_a?(Array) ? result.failure.last : result.failure.to_s
          return render json: { error: error_msg }, status: :unprocessable_entity
        end

        receipt = result.value!

        # Support JSON inspection or binary PDF streaming
        if params[:format] == 'json' || (request.format.json? && params[:download] != 'true')
          render json: receipt, serializer: PaymentReceiptSerializer
        else
          pdf_bytes = receipt.pdf_content
          send_data(
            pdf_bytes,
            filename: "LocalHelp_Receipt_#{receipt.receipt_number}.pdf",
            type: 'application/pdf',
            disposition: params[:disposition] == 'inline' ? 'inline' : 'attachment'
          )
        end
      end

      def request_email
        booking = Booking.find(params[:booking_id])
        authorize_booking_access!(booking)

        payment = booking.payments.where(status: 'paid').order(created_at: :desc).first
        unless payment
          return render json: { error: 'No successful payment found for this booking.' }, status: :unprocessable_entity
        end

        result = Payments::GeneratePaymentReceipt.call(payment: payment)
        unless result.success?
          error_msg = result.failure.is_a?(Array) ? result.failure.last : result.failure.to_s
          return render json: { error: error_msg }, status: :unprocessable_entity
        end

        receipt = result.value!
        target_email = params[:email].presence || current_user.email
        unless target_email.present?
          return render json: { error: 'No valid recipient email address available.' }, status: :unprocessable_entity
        end

        # Deduplication / rate limit: Avoid re-sending duplicate emails within 2 minutes
        if receipt.emailed_at.present? && receipt.emailed_at > 2.minutes.ago && receipt.last_emailed_to == target_email
          return render json: {
            message: "Receipt was already emailed to #{target_email} recently. Please check your spam or inbox.",
            already_sent: true,
            emailed_at: receipt.emailed_at.iso8601,
            recipient_email: target_email,
            receipt_number: receipt.receipt_number
          }, status: :ok
        end

        # Queue asynchronous email delivery
        DeliverPaymentReceiptJob.perform_later(receipt.id, target_email)

        receipt.update_columns(
          emailed_at: Time.current,
          last_emailed_to: target_email
        )

        render json: {
          message: "Payment receipt will be delivered to #{target_email} shortly.",
          already_sent: false,
          emailed_at: receipt.emailed_at.iso8601,
          recipient_email: target_email,
          receipt_number: receipt.receipt_number
        }, status: :ok
      end

      private

      def authorize_booking_access!(booking)
        # Booking owner or admin only; providers are isolated from customer payment receipts
        return if current_user.admin_or_super_admin? || booking.user_id == current_user.id

        raise Pundit::NotAuthorizedError, 'You are not authorized to view the payment receipt for this booking.'
      end

      def skip_authorization?
        true
      end
    end
  end
end

