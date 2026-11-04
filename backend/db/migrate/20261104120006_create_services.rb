class CreateServices < ActiveRecord::Migration[8.0]
  def change
    create_table :services do |t|
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.text :short_description
      t.string :pricing_type, null: false, default: 'quotation'
      t.decimal :fixed_price, precision: 10, scale: 2
      t.string :image_url
      t.integer :sort_order, default: 0
      t.boolean :active, default: true
      t.integer :estimated_duration_minutes

      t.timestamps
    end

    add_index :services, [:category_id, :active]
    add_index :services, :pricing_type
    add_index :services, :active
  end
end
