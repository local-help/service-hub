class AddBuilderConfigAndAddonsToServices < ActiveRecord::Migration[8.0]
  def change
    add_column :services, :builder_config, :jsonb, default: {}, null: false
    add_column :services, :addons, :jsonb, default: [], null: false
  end
end
