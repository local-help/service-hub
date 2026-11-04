class CreatePlatformSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :platform_settings do |t|
      t.string :key, null: false
      t.text :value
      t.string :value_type, null: false, default: 'string'
      t.text :description

      t.timestamps
    end

    add_index :platform_settings, :key, unique: true
  end
end
