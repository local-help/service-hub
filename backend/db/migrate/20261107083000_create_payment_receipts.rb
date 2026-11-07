# frozen_string_literal: true

class CreatePaymentReceipts < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_receipts do |t|
      t.references :payment, null: false, foreign_key: true, index: { unique: true }
      t.references :booking, null: false, foreign_key: true, index: true
      t.string :receipt_number, null: false
      t.string :status, null: false, default: 'issued'
      t.jsonb :receipt_data, null: false, default: {}
      t.string :document_storage_key
      t.datetime :generated_at, null: false
      t.datetime :emailed_at
      t.string :last_emailed_to
      t.datetime :voided_at
      t.text :void_reason
      t.bigint :original_receipt_id
      t.bigint :reissued_receipt_id

      t.timestamps
    end

    add_index :payment_receipts, :receipt_number, unique: true
    add_index :payment_receipts, :status
    add_index :payment_receipts, :original_receipt_id
  end
end

