class CategorySerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :image_url, :icon_name, :services_count

  def services_count
    object.services.active.count
  end
end

