class RenameAttributesInServiceVariants < ActiveRecord::Migration[8.0]
  def change
    rename_column :service_variants, :attributes, :variant_attributes
  end
end

