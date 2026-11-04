class SubcategorySerializer < ActiveModel::Serializer
  attributes :id, :category_id, :name, :slug, :description, :position, :active, :services_count

  def services_count
    object.services.active.count
  end
end
