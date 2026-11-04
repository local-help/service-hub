class ProviderUser < ApplicationRecord
  belongs_to :user
  belongs_to :provider

  enum :role, { owner: 'owner', manager: 'manager', staff: 'staff' }, prefix: true

  validates :role, presence: true
  validates :user_id, uniqueness: { scope: :provider_id }

  scope :active, -> { where(active: true) }
end

