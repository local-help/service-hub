class AddressSerializer < ActiveModel::Serializer
  attributes :id, :label, :address_line, :landmark, :city, :state,
             :postal_code, :latitude, :longitude, :is_default, :full_address

  def latitude
    object.latitude&.to_f
  end

  def longitude
    object.longitude&.to_f
  end
end

