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
