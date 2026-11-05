# == Schema Information
#
# Table name: service_pricing
#
#  id                    :bigint           not null, primary key
#  active                :boolean          default(TRUE), not null
#  applicable_conditions :jsonb
#  price                 :decimal(10, 2)
#  pricing_type          :string           default("fixed"), not null
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  service_variant_id    :bigint           not null
#
# Indexes
#
#  index_service_pricing_on_active              (active)
#  index_service_pricing_on_pricing_type        (pricing_type)
#  index_service_pricing_on_service_variant_id  (service_variant_id)
#
# Foreign Keys
#
#  fk_rails_...  (service_variant_id => service_variants.id)
#
class ServicePricingSerializer < ActiveModel::Serializer
  attributes :id, :service_variant_id, :price, :pricing_type, :applicable_conditions, :active

  def price
    object.price&.to_f
  end
end
