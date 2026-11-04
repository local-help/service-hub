class ServiceVariantSerializer < ActiveModel::Serializer
  attributes :id, :service_id, :name, :description, :variant_attributes, :position, :active, :primary_price

  has_many :service_pricings, serializer: ServicePricingSerializer

  def primary_price
    object.primary_price&.to_f
  end
end
