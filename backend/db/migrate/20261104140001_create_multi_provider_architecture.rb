class CreateMultiProviderArchitecture < ActiveRecord::Migration[8.0]
  def change
    # 1. Extend providers table (acting as service_providers)
    change_table :providers do |t|
      t.string :slug
      t.string :contact_person
      t.string :contact_phone
      t.string :contact_email
      t.text :business_address
      t.string :state, default: 'Uttar Pradesh'
      t.string :postal_code, default: '211001'
      t.string :verification_status, default: 'verified', null: false
      t.string :operational_status, default: 'active', null: false
      t.string :onboarding_status, default: 'completed', null: false
      t.datetime :approved_at
      t.bigint :approved_by_id
      t.datetime :suspended_at
      t.text :suspension_reason
    end
    add_index :providers, :slug, unique: true
    add_index :providers, :verification_status
    add_index :providers, :operational_status
    add_foreign_key :providers, :users, column: :approved_by_id

    # 2. Create provider_users table
    create_table :provider_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :provider, null: false, foreign_key: true
      t.string :role, default: 'owner', null: false
      t.boolean :active, default: true, null: false

      t.timestamps
    end
    add_index :provider_users, [:user_id, :provider_id], unique: true
    add_index :provider_users, :active

    # 3. Extend provider_services table
    change_table :provider_services do |t|
      t.boolean :active, default: true, null: false
      t.jsonb :provider_specific_pricing, default: {}
    end
    add_index :provider_services, :active

    # 4. Create provider_assignments table
    create_table :provider_assignments do |t|
      t.references :service_request, null: false, foreign_key: true
      t.references :provider, null: false, foreign_key: true
      t.bigint :assigned_by_id, null: false
      t.datetime :assigned_at, null: false
      t.datetime :accepted_at
      t.datetime :rejected_at
      t.datetime :completed_at
      t.string :status, default: 'assigned', null: false
      t.text :rejection_reason
      t.text :internal_notes

      t.timestamps
    end
    add_index :provider_assignments, :status
    add_foreign_key :provider_assignments, :users, column: :assigned_by_id

    # 5. Create provider_availabilities table
    create_table :provider_availabilities do |t|
      t.references :provider, null: false, foreign_key: true, index: { unique: true }
      t.boolean :is_available, default: true, null: false
      t.jsonb :operating_days, default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      t.string :working_hours_start, default: "09:00"
      t.string :working_hours_end, default: "20:00"
      t.datetime :temporary_unavailability_start
      t.datetime :temporary_unavailability_end
      t.text :unavailability_reason

      t.timestamps
    end

    # 6. Update quotations table
    change_table :quotations do |t|
      t.references :provider, foreign_key: true, null: true
      t.references :provider_assignment, foreign_key: true, null: true
      t.string :estimated_completion_time
      t.bigint :reviewed_by_id
      t.datetime :reviewed_at
    end
    add_foreign_key :quotations, :users, column: :reviewed_by_id

    # Replace global unique index on quotations.service_request_id with conditional unique index
    remove_index :quotations, :service_request_id
    add_index :quotations, :service_request_id,
              unique: true,
              where: "status IN ('draft', 'submitted', 'pending', 'approved')",
              name: "index_quotations_on_active_per_request"
  end
end
