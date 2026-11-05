# == Schema Information
#
# Table name: service_variants
#
#  id                 :bigint           not null, primary key
#  active             :boolean          default(TRUE), not null
#  description        :text
#  name               :string           not null
#  position           :integer          default(0), not null
#  variant_attributes :jsonb
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  service_id         :bigint           not null
#
# Indexes
#
#  index_service_variants_on_active      (active)
#  index_service_variants_on_position    (position)
#  index_service_variants_on_service_id  (service_id)
#
# Foreign Keys
#
#  fk_rails_...  (service_id => services.id)
#
class ServiceVariantSerializer < ActiveModel::Serializer
  attributes :id, :service_id, :name, :description, :variant_attributes, :position, :active, :primary_price

  has_many :service_pricings, serializer: ServicePricingSerializer

  def primary_price
    object.primary_price&.to_f
  end
end
