# frozen_string_literal: true

module Api
  module V1
    module Admin
      class PaymentReceiptsController < ApplicationController
        before_action :require_admin!

        def index
          receipts = PaymentReceipt.includes(:booking, :payment).recent

          if params[:search].present?
            query = "%#{params[:search].strip}%"
            receipts = receipts.joins(:booking, :payment).where(
              'payment_receipts.receipt_number ILIKE :q OR bookings.reference_number ILIKE :q OR payments.gateway_reference ILIKE :q OR payment_receipts.receipt_data->\'customer\'->>\'name\' ILIKE :q',
              q: query
            )
          end

          receipts = receipts.where(status: params[:status]) if params[:status].present?
          receipts = receipts.where(booking_id: params[:booking_id]) if params[:booking_id].present?

          receipts = paginate(receipts)
          render json: receipts, each_serializer: PaymentReceiptSerializer, meta: pagination_meta(receipts)
        end

        def show
          receipt = PaymentReceipt.find(params[:id])
          render json: receipt, serializer: PaymentReceiptSerializer
        end

        def download
          receipt = PaymentReceipt.find(params[:id])
          pdf_bytes = receipt.pdf_content

          unless pdf_bytes.present?
            # Re-render if missing
            pdf_bytes = Payments::GenerateReceiptPdf.call(receipt_data: receipt.receipt_data)
          end

          send_data(
            pdf_bytes,
            filename: "Receipt_#{receipt.receipt_number}.pdf",
            type: 'application/pdf',
            disposition: params[:disposition] == 'inline' ? 'inline' : 'attachment'
          )
        end

        def void
          receipt = PaymentReceipt.find(params[:id])
          reason = params[:reason].presence || 'Voided by administrative audit'

          receipt.void!(reason: reason)

          AdminActivityLog.log!(
            admin: current_user,
            action: 'void_receipt',
            entity: receipt,
            metadata: {
              receipt_number: receipt.receipt_number,
              reason: reason,
              booking_id: receipt.booking_id
            }
          )

          render json: receipt, serializer: PaymentReceiptSerializer
        end

        private

        def skip_authorization?
          true
        end

        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count
          }
        end
      end
    end
  end
end

