class CreateServiceRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :service_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.references :service, null: false, foreign_key: true
      t.references :address, null: false, foreign_key: true
      t.references :provider, foreign_key: true
      t.string :reference_number, null: false
      t.text :description, null: false
      t.datetime :preferred_at
      t.string :status, null: false, default: 'pending_review'
      t.bigint :assigned_by
      t.datetime :assigned_at
      t.text :admin_notes
      t.text :cancellation_reason

      t.timestamps
    end

    add_index :service_requests, :reference_number, unique: true
    add_index :service_requests, :status
    add_index :service_requests, [:user_id, :status]
    add_index :service_requests, :preferred_at
    add_foreign_key :service_requests, :users, column: :assigned_by
  end
end
