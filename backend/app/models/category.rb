class Category < ApplicationRecord
  has_many :services, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  scope :active, -> { where(active: true) }
  scope :sorted, -> { order(sort_order: :asc, name: :asc) }

  def services_count
    services.active.count
  end
end
