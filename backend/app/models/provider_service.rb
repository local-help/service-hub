# == Schema Information
#
# Table name: provider_services
#
#  id                        :bigint           not null, primary key
#  active                    :boolean          default(TRUE), not null
#  provider_specific_pricing :jsonb
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  provider_id               :bigint           not null
#  service_id                :bigint           not null
#
# Indexes
#
#  index_provider_services_on_active                      (active)
#  index_provider_services_on_provider_id                 (provider_id)
#  index_provider_services_on_provider_id_and_service_id  (provider_id,service_id) UNIQUE
#  index_provider_services_on_service_id                  (service_id)
#
# Foreign Keys
#
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_id => services.id)
#
class ProviderService < ApplicationRecord
  belongs_to :provider
  belongs_to :service

  validates :service_id, uniqueness: { scope: :provider_id }

  scope :active, -> { where(active: true) }

  def custom_price_for(variant_id: nil)
    pricing = provider_specific_pricing || {}
    if variant_id.present? && pricing["variant_#{variant_id}"].present?
      pricing["variant_#{variant_id}"].to_f
    elsif pricing['base_price'].present?
      pricing['base_price'].to_f
    else
      service.display_price
    end
  end
end
