# == Schema Information
#
# Table name: device_tokens
#
#  id         :bigint           not null, primary key
#  active     :boolean          default(TRUE)
#  platform   :string           not null
#  token      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_device_tokens_on_token               (token) UNIQUE
#  index_device_tokens_on_user_id             (user_id)
#  index_device_tokens_on_user_id_and_active  (user_id,active)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class DeviceToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: %w[ios android web] }

  scope :active, -> { where(active: true) }
  scope :by_platform, ->(platform) { where(platform: platform) if platform.present? }
end
