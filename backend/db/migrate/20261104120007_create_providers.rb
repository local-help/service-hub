class CreateProviders < ActiveRecord::Migration[8.0]
  def change
    create_table :providers do |t|
      t.string :name, null: false
      t.string :phone, null: false
      t.string :email
      t.text :address
      t.string :city
      t.string :service_area
      t.text :notes
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :providers, :phone
    add_index :providers, :active
    add_index :providers, :city
  end
end
