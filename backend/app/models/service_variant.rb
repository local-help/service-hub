class ServiceVariant < ApplicationRecord
  belongs_to :service

  has_many :service_pricings, dependent: :destroy
  has_many :service_requests, foreign_key: :service_variant_id, dependent: :nullify

  validates :name, presence: true

  scope :active, -> { where(active: true) }
  scope :sorted, -> { order(position: :asc, name: :asc) }

  def current_pricing
    service_pricings.where(active: true).first
  end

  def primary_price
    current_pricing&.price
  end

  def vehicle_types
    (variant_attributes || {})['vehicle_types'] || []
  end

  def package_type
    (variant_attributes || {})['package_type']
  end
end
