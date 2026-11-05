# == Schema Information
#
# Table name: status_histories
#
#  id              :bigint           not null, primary key
#  changed_by      :bigint
#  entity_type     :string           not null
#  new_status      :string           not null
#  notes           :text
#  previous_status :string
#  created_at      :datetime         not null
#  entity_id       :bigint           not null
#
# Indexes
#
#  index_status_histories_on_entity_type_and_entity_id  (entity_type,entity_id)
#
# Foreign Keys
#
#  fk_rails_...  (changed_by => users.id)
#
class StatusHistory < ApplicationRecord
  belongs_to :changed_by_user, class_name: 'User', foreign_key: :changed_by, optional: true

  validates :entity_type, presence: true
  validates :entity_id, presence: true
  validates :new_status, presence: true

  scope :for_entity, ->(type, id) { where(entity_type: type, entity_id: id) }
  scope :recent, -> { order(created_at: :desc) }
end
