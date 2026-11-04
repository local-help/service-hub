class CreateBookings < ActiveRecord::Migration[8.0]
  def change
    create_table :bookings do |t|
      t.references :service_request, null: false, foreign_key: true, index: { unique: true }
      t.references :quotation, foreign_key: true
      t.datetime :scheduled_at
      t.string :status, null: false, default: 'confirmed'
      t.text :cancellation_reason
      t.text :admin_notes
      t.integer :rating
      t.text :feedback

      t.timestamps
    end

    add_index :bookings, :status
    add_index :bookings, :scheduled_at
  end
end
