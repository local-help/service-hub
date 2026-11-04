class CreateAddresses < ActiveRecord::Migration[8.0]
  def change
    create_table :addresses do |t|
      t.references :user, null: false, foreign_key: true
      t.string :label
      t.string :address_line, null: false
      t.string :landmark
      t.string :city, null: false
      t.string :state, null: false
      t.string :postal_code, null: false
      t.decimal :latitude, precision: 10, scale: 7
      t.decimal :longitude, precision: 10, scale: 7
      t.boolean :is_default, default: false

      t.timestamps
    end

    add_index :addresses, [:user_id, :is_default]
  end
end
