class CreateQuotations < ActiveRecord::Migration[8.0]
  def change
    create_table :quotations do |t|
      t.references :service_request, null: false, foreign_key: true, index: { unique: true }
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.text :description
      t.string :status, null: false, default: 'pending'
      t.datetime :valid_until, null: false
      t.bigint :created_by, null: false

      t.timestamps
    end

    add_index :quotations, :status
    add_foreign_key :quotations, :users, column: :created_by
  end
end
