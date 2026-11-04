class Service < ApplicationRecord
  belongs_to :category
  belongs_to :subcategory, optional: true

  has_many :variants, -> { sorted }, class_name: 'ServiceVariant', dependent: :destroy
  alias_method :service_variants, :variants
  has_many :service_pricings, through: :variants
  has_many :provider_services, dependent: :destroy
  has_many :providers, through: :provider_services
  has_many :service_requests, dependent: :restrict_with_error

  enum :pricing_type, { fixed_price: 'fixed_price', quotation: 'quotation' }
  enum :booking_type, { fixed_price: 'fixed_price', quotation: 'quotation', time_based: 'time_based' }, prefix: true

  before_validation :generate_slug, on: :create
  before_validation :sync_pricing_and_booking_types

  validates :name, presence: true
  validates :slug, presence: true
  validates :booking_type, presence: true
  validates :fixed_price, numericality: { greater_than: 0 }, allow_nil: true
  validate :must_have_price_or_variants, if: :fixed_price?

  scope :active, -> { where(active: true) }
  scope :available, -> { active.where(coming_soon: false) }
  scope :sorted, -> { order(position: :asc, sort_order: :asc, name: :asc) }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  scope :by_subcategory, ->(subcategory_id) { where(subcategory_id: subcategory_id) }
  scope :search, ->(query) {
    where("name ILIKE :q OR description ILIKE :q", q: "%#{query}%") if query.present?
  }
  scope :for_vehicle_type, ->(vtype) {
    where("supported_vehicle_types ? :vt OR supported_vehicle_types = '[]'::jsonb", vt: vtype)
  }

  def fixed_price?
    booking_type_fixed_price? || pricing_type == 'fixed_price'
  end

  def requires_quotation?
    booking_type_quotation? || pricing_type == 'quotation'
  end

  def is_time_based?
    booking_type_time_based?
  end

  def display_price
    if fixed_price?
      fixed_price || variants.active.first&.primary_price
    elsif is_time_based?
      variants.active.first&.primary_price || fixed_price
    else
      nil
    end
  end

  private

  def must_have_price_or_variants
    return if fixed_price.present?
    return if variants.any? || (persisted? && variants.count > 0)
    errors.add(:fixed_price, "can't be blank unless service variants are configured")
  end

  def generate_slug
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
  end

  def sync_pricing_and_booking_types
    if pricing_type_changed? && pricing_type.present? && !booking_type_changed?
      self.booking_type = pricing_type
    elsif booking_type_changed? && booking_type.present?
      self.pricing_type = booking_type_fixed_price? ? 'fixed_price' : 'quotation'
    elsif booking_type.present?
      self.pricing_type = booking_type_fixed_price? ? 'fixed_price' : 'quotation'
    elsif pricing_type.present?
      self.booking_type = pricing_type
    end
  end
end
