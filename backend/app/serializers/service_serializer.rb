class ServiceSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :short_description, :pricing_type, :booking_type,
             :fixed_price, :image_url, :estimated_duration_minutes,
             :category_id, :subcategory_id, :coming_soon, :position,
             :supported_vehicle_types

  def fixed_price
    object.fixed_price&.to_f
  end
end
