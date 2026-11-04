class DeviceToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: %w[ios android web] }

  scope :active, -> { where(active: true) }
  scope :by_platform, ->(platform) { where(platform: platform) if platform.present? }
end
