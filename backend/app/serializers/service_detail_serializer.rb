class ServiceDetailSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :short_description, :pricing_type,
             :booking_type, :fixed_price, :image_url, :estimated_duration_minutes,
             :category_id, :subcategory_id, :coming_soon, :position,
             :supported_vehicle_types, :builder_config, :addons

  belongs_to :category, serializer: CategorySerializer
  belongs_to :subcategory, serializer: SubcategorySerializer
  has_many :variants, serializer: ServiceVariantSerializer

  def fixed_price
    object.fixed_price&.to_f
  end
end
