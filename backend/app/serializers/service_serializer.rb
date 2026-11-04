class ServiceSerializer < ActiveModel::Serializer
  attributes :id, :name, :short_description, :pricing_type, :fixed_price,
             :image_url, :estimated_duration_minutes, :category_id

  def fixed_price
    object.fixed_price&.to_f
  end
end

