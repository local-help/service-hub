# == Schema Information
#
# Table name: addresses
#
#  id           :bigint           not null, primary key
#  address_line :string           not null
#  city         :string           not null
#  is_default   :boolean          default(FALSE)
#  label        :string
#  landmark     :string
#  latitude     :decimal(10, 7)
#  longitude    :decimal(10, 7)
#  postal_code  :string           not null
#  state        :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_addresses_on_user_id                 (user_id)
#  index_addresses_on_user_id_and_is_default  (user_id,is_default)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
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
