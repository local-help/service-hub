class CreateAdminActivityLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :admin_activity_logs do |t|
      t.bigint :admin_user_id, null: false
      t.string :action, null: false
      t.string :entity_type
      t.bigint :entity_id
      t.jsonb :metadata, default: {}

      t.datetime :created_at, null: false
    end

    add_index :admin_activity_logs, :admin_user_id
    add_index :admin_activity_logs, [:entity_type, :entity_id]
    add_index :admin_activity_logs, :created_at
    add_foreign_key :admin_activity_logs, :users, column: :admin_user_id
  end
end
