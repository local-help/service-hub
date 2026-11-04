class Category < ApplicationRecord
  has_many :subcategories, -> { sorted }, dependent: :destroy
  has_many :services, dependent: :destroy

  before_validation :generate_slug, on: :create

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :slug, presence: true, uniqueness: { case_sensitive: false }

  scope :active, -> { where(active: true) }
  scope :available, -> { active.where(coming_soon: false) }
  scope :sorted, -> { order(position: :asc, sort_order: :asc, name: :asc) }

  def services_count
    services.active.count
  end

  def subcategories_count
    subcategories.active.count
  end

  private

  def generate_slug
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
  end
end
