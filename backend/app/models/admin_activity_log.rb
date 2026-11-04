class AdminActivityLog < ApplicationRecord
  belongs_to :admin_user, class_name: 'User', foreign_key: :admin_user_id

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
