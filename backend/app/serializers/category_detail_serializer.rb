class CategoryDetailSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :icon, :image_url, :icon_name,
             :position, :coming_soon

  has_many :subcategories, serializer: SubcategorySerializer
  has_many :active_services, serializer: ServiceSerializer

  def subcategories
    object.subcategories.active.sorted
  end

  def active_services
    object.services.active.sorted
  end
end
