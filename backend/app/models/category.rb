# == Schema Information
#
# Table name: categories
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE)
#  coming_soon :boolean          default(FALSE), not null
#  description :text
#  icon        :string
#  icon_name   :string
#  image_url   :string
#  name        :string           not null
#  position    :integer          default(0), not null
#  slug        :string
#  sort_order  :integer          default(0)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_categories_on_active       (active)
#  index_categories_on_coming_soon  (coming_soon)
#  index_categories_on_name         (name) UNIQUE
#  index_categories_on_position     (position)
#  index_categories_on_slug         (slug) UNIQUE
#  index_categories_on_sort_order   (sort_order)
#
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
