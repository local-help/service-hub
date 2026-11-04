class ServiceDetailSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :short_description, :pricing_type,
             :fixed_price, :image_url, :estimated_duration_minutes

  belongs_to :category, serializer: CategorySerializer

  def fixed_price
    object.fixed_price&.to_f
  end
end

