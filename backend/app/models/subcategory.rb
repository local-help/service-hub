# == Schema Information
#
# Table name: subcategories
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE), not null
#  description :text
#  name        :string           not null
#  position    :integer          default(0), not null
#  slug        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  category_id :bigint           not null
#
# Indexes
#
#  index_subcategories_on_active                (active)
#  index_subcategories_on_category_id           (category_id)
#  index_subcategories_on_category_id_and_slug  (category_id,slug) UNIQUE
#  index_subcategories_on_position              (position)
#
# Foreign Keys
#
#  fk_rails_...  (category_id => categories.id)
#
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
