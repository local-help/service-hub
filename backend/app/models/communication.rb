# == Schema Information
#
# Table name: communications
#
#  id                 :bigint           not null, primary key
#  channel            :string           not null
#  communicated_at    :datetime         not null
#  direction          :string           not null
#  outcome            :text
#  summary            :text
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  admin_user_id      :bigint           not null
#  booking_id         :bigint
#  service_request_id :bigint
#
# Indexes
#
#  index_communications_on_booking_id          (booking_id)
#  index_communications_on_channel             (channel)
#  index_communications_on_service_request_id  (service_request_id)
#
# Foreign Keys
#
#  fk_rails_...  (admin_user_id => users.id)
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
class Communication < ApplicationRecord
  belongs_to :service_request, optional: true
  belongs_to :booking, optional: true
  belongs_to :admin_user, class_name: 'User'

  CHANNELS = %w[phone whatsapp].freeze
  DIRECTIONS = %w[inbound outbound].freeze

  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :direction, presence: true, inclusion: { in: DIRECTIONS }
  validates :communicated_at, presence: true

  scope :recent, -> { order(communicated_at: :desc) }
  scope :by_channel, ->(channel) { where(channel: channel) if channel.present? }
end
