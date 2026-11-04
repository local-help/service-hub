class Service < ApplicationRecord
  belongs_to :category

  has_many :provider_services, dependent: :destroy
  has_many :providers, through: :provider_services
  has_many :service_requests, dependent: :restrict_with_error

  enum :pricing_type, { fixed_price: 'fixed_price', quotation: 'quotation' }

  validates :name, presence: true
  validates :pricing_type, presence: true
  validates :fixed_price, presence: true, numericality: { greater_than: 0 }, if: :fixed_price?

  scope :active, -> { where(active: true) }
  scope :sorted, -> { order(sort_order: :asc, name: :asc) }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  scope :search, ->(query) {
    where("name ILIKE :q OR description ILIKE :q", q: "%#{query}%") if query.present?
  }

  def requires_quotation?
    quotation?
  end

  def display_price
    fixed_price? ? fixed_price : nil
  end
end
