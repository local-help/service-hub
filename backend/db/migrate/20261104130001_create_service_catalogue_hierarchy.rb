class CreateServiceCatalogueHierarchy < ActiveRecord::Migration[8.0]
  def change
    # 1. Extend categories
    change_table :categories do |t|
      t.string :slug
      t.string :icon
      t.integer :position, default: 0, null: false
      t.boolean :coming_soon, default: false, null: false
    end
    add_index :categories, :slug, unique: true
    add_index :categories, :position
    add_index :categories, :coming_soon

    # 2. Create subcategories
    create_table :subcategories do |t|
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.integer :position, default: 0, null: false
      t.boolean :active, default: true, null: false

      t.timestamps
    end
    add_index :subcategories, [:category_id, :slug], unique: true
    add_index :subcategories, :position
    add_index :subcategories, :active

    # 3. Extend services
    change_table :services do |t|
      t.references :subcategory, foreign_key: true, null: true
      t.string :slug
      t.string :booking_type, default: 'quotation', null: false
      t.boolean :coming_soon, default: false, null: false
      t.integer :position, default: 0, null: false
      t.jsonb :supported_vehicle_types, default: []
    end
    add_index :services, :slug
    add_index :services, :booking_type
    add_index :services, :coming_soon
    add_index :services, :position

    # 4. Create service_variants
    create_table :service_variants do |t|
      t.references :service, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.jsonb :attributes, default: {}
      t.integer :position, default: 0, null: false
      t.boolean :active, default: true, null: false

      t.timestamps
    end
    add_index :service_variants, :position
    add_index :service_variants, :active

    # 5. Create service_pricing
    create_table :service_pricing do |t|
      t.references :service_variant, null: false, foreign_key: true
      t.decimal :price, precision: 10, scale: 2
      t.string :pricing_type, default: 'fixed', null: false
      t.jsonb :applicable_conditions, default: {}
      t.boolean :active, default: true, null: false

      t.timestamps
    end
    add_index :service_pricing, :pricing_type
    add_index :service_pricing, :active

    # 6. Extend service_requests to record chosen variant, vehicle, duration, and options
    change_table :service_requests do |t|
      t.references :service_variant, foreign_key: true, null: true
      t.string :booking_type
      t.string :vehicle_type
      t.integer :duration_hours
      t.jsonb :selected_options, default: {}
    end
  end
end

