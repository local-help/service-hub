class CategoryDetailSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :icon, :image_url, :icon_name,
             :position, :active, :coming_soon

  has_many :subcategories, serializer: SubcategorySerializer
  has_many :services, serializer: ServiceSerializer
  has_many :active_services, serializer: ServiceSerializer

  def subcategories
    object.subcategories.sorted
  end

  def services
    object.services.sorted
  end

  def active_services
    object.services.active.sorted
  end
end
