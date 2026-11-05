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
class ServicePricing < ApplicationRecord
  self.table_name = 'service_pricing'

  belongs_to :service_variant

  validates :pricing_type, presence: true

  scope :active, -> { where(active: true) }

  # Calculates dynamic total based on configured applicable_conditions
  # conditions format example for Driver Services:
  # {
  #   "base_hours": 8,
  #   "base_price": 800,
  #   "additional_hour_rate": 50,
  #   "night_start_hour": 22,
  #   "night_additional_hour_rate": 100,
  #   "night_fixed_charge": 300
  # }
  def calculate_tariff(duration_hours: 8, extends_past_night: false, night_hours: 0)
    conds = applicable_conditions || {}
    base_price = (conds['base_price'] || price || 0).to_f
    base_hours = (conds['base_hours'] || 8).to_i
    extra_rate = (conds['additional_hour_rate'] || 50).to_f
    night_rate = (conds['night_additional_hour_rate'] || 100).to_f
    night_charge = (conds['night_fixed_charge'] || 300).to_f

    total = base_price
    extra_day_hours = [duration_hours.to_i - base_hours - night_hours.to_i, 0].max
    total += extra_day_hours * extra_rate

    if extends_past_night || night_hours.to_i > 0
      total += night_charge
      total += night_hours.to_i * night_rate
    end

    total
  end
end
