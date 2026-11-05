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
class CommunicationSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :admin_user_id, :admin_name,
             :channel, :direction, :summary, :outcome, :communicated_at,
             :created_at

  def admin_name
    object.admin_user.name
  end

  def communicated_at
    object.communicated_at.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
