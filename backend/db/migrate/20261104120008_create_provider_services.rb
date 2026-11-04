class CreateProviderServices < ActiveRecord::Migration[8.0]
  def change
    create_table :provider_services do |t|
      t.references :provider, null: false, foreign_key: true
      t.references :service, null: false, foreign_key: true

      t.timestamps
    end

    add_index :provider_services, [:provider_id, :service_id], unique: true
  end
end
