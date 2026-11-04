class Communication < ApplicationRecord
  belongs_to :service_request
  belongs_to :admin_user, class_name: 'User', foreign_key: :admin_user_id

  CHANNELS = %w[phone whatsapp].freeze
  DIRECTIONS = %w[inbound outbound].freeze

  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :direction, presence: true, inclusion: { in: DIRECTIONS }
  validates :communicated_at, presence: true

  scope :recent, -> { order(communicated_at: :desc) }
  scope :by_channel, ->(channel) { where(channel: channel) if channel.present? }
end
