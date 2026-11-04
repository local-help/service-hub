class CategorySerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :icon, :image_url, :icon_name,
             :position, :coming_soon, :services_count, :subcategories_count

  def services_count
    object.services.active.count
  end

  def subcategories_count
    object.subcategories.active.count
  end
end
