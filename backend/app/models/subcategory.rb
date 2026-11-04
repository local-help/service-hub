class Subcategory < ApplicationRecord
  belongs_to :category

  has_many :services, -> { sorted }, dependent: :destroy

  before_validation :generate_slug, on: :create

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :category_id, case_sensitive: false }

  scope :active, -> { where(active: true) }
  scope :sorted, -> { order(position: :asc, name: :asc) }

  def active_services_count
    services.active.count
  end

  private

  def generate_slug
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
  end
end

