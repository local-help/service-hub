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
class ServiceVariant < ApplicationRecord
  belongs_to :service

  has_many :service_pricings, dependent: :destroy
  has_many :service_requests, dependent: :nullify

  validates :name, presence: true

  scope :active, -> { where(active: true) }
  scope :sorted, -> { order(position: :asc, name: :asc) }

  def current_pricing
    service_pricings.where(active: true).first
  end

  def primary_price
    current_pricing&.price
  end

  def price
    primary_price
  end

  def vehicle_types
    (variant_attributes || {})['vehicle_types'] || []
  end

  def vehicle_type
    (variant_attributes || {})['vehicle_type'] || vehicle_types.first
  end

  def package_type
    (variant_attributes || {})['package_type']
  end
end
