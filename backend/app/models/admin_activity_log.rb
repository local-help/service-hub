# == Schema Information
#
# Table name: admin_activity_logs
#
#  id            :bigint           not null, primary key
#  action        :string           not null
#  entity_type   :string
#  metadata      :jsonb
#  created_at    :datetime         not null
#  admin_user_id :bigint           not null
#  entity_id     :bigint
#
# Indexes
#
#  index_admin_activity_logs_on_admin_user_id              (admin_user_id)
#  index_admin_activity_logs_on_created_at                 (created_at)
#  index_admin_activity_logs_on_entity_type_and_entity_id  (entity_type,entity_id)
#
# Foreign Keys
#
#  fk_rails_...  (admin_user_id => users.id)
#
class AdminActivityLog < ApplicationRecord
  belongs_to :admin_user, class_name: 'User'

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_admin, ->(admin_id) { where(admin_user_id: admin_id) if admin_id.present? }
  scope :by_entity, ->(type, id) { where(entity_type: type, entity_id: id) }

  def self.log!(admin:, action:, entity: nil, metadata: {})
    create!(
      admin_user: admin,
      action: action,
      entity_type: entity&.class&.name,
      entity_id: entity&.id,
      metadata: metadata
    )
  end
end
