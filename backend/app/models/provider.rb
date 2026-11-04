class Provider < ApplicationRecord
  has_many :provider_services, dependent: :destroy
  has_many :services, through: :provider_services
  has_many :service_requests, dependent: :restrict_with_error

  validates :name, presence: true
  validates :phone, presence: true

  scope :active, -> { where(active: true) }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :for_service, ->(service_id) {
    joins(:provider_services).where(provider_services: { service_id: service_id })
  }
  scope :search, ->(query) {
    where("name ILIKE :q OR phone ILIKE :q OR email ILIKE :q", q: "%#{query}%") if query.present?
  }
end
