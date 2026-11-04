class ServicePricingSerializer < ActiveModel::Serializer
  attributes :id, :service_variant_id, :price, :pricing_type, :applicable_conditions, :active

  def price
    object.price&.to_f
  end
end

