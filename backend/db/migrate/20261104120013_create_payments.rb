class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments do |t|
      t.references :booking, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :method, null: false
      t.string :status, null: false, default: 'pending'
      t.string :gateway_reference
      t.string :gateway_order_id
      t.jsonb :gateway_metadata, default: {}
      t.bigint :recorded_by

      t.timestamps
    end

    add_index :payments, :status
    add_index :payments, :gateway_reference, unique: true, where: "gateway_reference IS NOT NULL"
    add_index :payments, :gateway_order_id, unique: true, where: "gateway_order_id IS NOT NULL"
    add_foreign_key :payments, :users, column: :recorded_by
  end
end
