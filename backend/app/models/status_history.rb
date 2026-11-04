class StatusHistory < ApplicationRecord
  belongs_to :changed_by_user, class_name: 'User', foreign_key: :changed_by, optional: true

  validates :entity_type, presence: true
  validates :entity_id, presence: true
  validates :new_status, presence: true

  scope :for_entity, ->(type, id) { where(entity_type: type, entity_id: id) }
  scope :recent, -> { order(created_at: :desc) }
end
