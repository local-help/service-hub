# == Schema Information
#
# Table name: services
#
#  id                         :bigint           not null, primary key
#  active                     :boolean          default(TRUE)
#  addons                     :jsonb            not null
#  booking_type               :string           default("quotation"), not null
#  builder_config             :jsonb            not null
#  coming_soon                :boolean          default(FALSE), not null
#  description                :text
#  estimated_duration_minutes :integer
#  fixed_price                :decimal(10, 2)
#  image_url                  :string
#  name                       :string           not null
#  position                   :integer          default(0), not null
#  pricing_type               :string           default("quotation"), not null
#  short_description          :text
#  slug                       :string
#  sort_order                 :integer          default(0)
#  supported_vehicle_types    :jsonb
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  category_id                :bigint           not null
#  subcategory_id             :bigint
#
# Indexes
#
#  index_services_on_active                  (active)
#  index_services_on_booking_type            (booking_type)
#  index_services_on_category_id             (category_id)
#  index_services_on_category_id_and_active  (category_id,active)
#  index_services_on_coming_soon             (coming_soon)
#  index_services_on_position                (position)
#  index_services_on_pricing_type            (pricing_type)
#  index_services_on_slug                    (slug)
#  index_services_on_subcategory_id          (subcategory_id)
#
# Foreign Keys
#
#  fk_rails_...  (category_id => categories.id)
#  fk_rails_...  (subcategory_id => subcategories.id)
#
class Service < ApplicationRecord
  belongs_to :category
  belongs_to :subcategory, optional: true

  has_many :variants, -> { sorted }, class_name: 'ServiceVariant', dependent: :destroy
  has_many :service_variants, -> { sorted }, class_name: 'ServiceVariant', dependent: :destroy
  has_many :service_pricings, through: :variants
  has_many :provider_services, dependent: :destroy
  has_many :providers, through: :provider_services
  has_many :bookings, dependent: :restrict_with_error
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
  scope :search, lambda { |query|
    where("name ILIKE :q OR description ILIKE :q", q: "%#{query}%") if query.present?
  }
  scope :for_vehicle_type, lambda { |vtype|
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
    end
  end

  private

  def must_have_price_or_variants
    return if fixed_price.present?
    return if variants.any? || (persisted? && !variants.empty?)

    errors.add(:fixed_price, "can't be blank unless service variants are configured")
  end

  def generate_slug
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
  end

  def sync_pricing_and_booking_types
    if booking_type.present? && (booking_type_changed? || pricing_type.blank?)
      self.pricing_type = booking_type_fixed_price? ? 'fixed_price' : 'quotation'
    elsif pricing_type.present? && (pricing_type_changed? || booking_type.blank?)
      self.booking_type = pricing_type
    end
  end
end
