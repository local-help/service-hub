# frozen_string_literal: true

class PaymentReceiptSerializer < ActiveModel::Serializer
  attributes :id, :payment_id, :booking_id, :receipt_number, :status,
             :generated_at, :emailed_at, :last_emailed_to, :voided_at,
             :void_reason, :total_amount, :payment_reference,
             :payment_method, :customer_name, :service_name,
             :receipt_data, :created_at

  def total_amount
    object.total_amount
  end

  def payment_reference
    object.payment_reference
  end

  def payment_method
    object.payment_method
  end

  def customer_name
    object.customer_name
  end

  def service_name
    object.service_name
  end

  def generated_at
    object.generated_at&.iso8601
  end

  def emailed_at
    object.emailed_at&.iso8601
  end

  def voided_at
    object.voided_at&.iso8601
  end

  def created_at
    object.created_at&.iso8601
  end
end

