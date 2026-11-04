class CategoryDetailSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :image_url, :icon_name

  has_many :active_services, serializer: ServiceSerializer

  def active_services
    object.services.active.sorted
  end
end

