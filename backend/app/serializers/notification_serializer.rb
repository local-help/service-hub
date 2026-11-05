# == Schema Information
#
# Table name: notifications
#
#  id                :bigint           not null, primary key
#  body              :text
#  metadata          :jsonb
#  notification_type :string           not null
#  read_at           :datetime
#  title             :string           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  user_id           :bigint           not null
#
# Indexes
#
#  index_notifications_on_user_id                 (user_id)
#  index_notifications_on_user_id_and_created_at  (user_id,created_at)
#  index_notifications_on_user_id_and_read_at     (user_id,read_at)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class NotificationSerializer < ActiveModel::Serializer
  attributes :id, :notification_type, :title, :body, :metadata, :read_at, :is_read, :created_at

  def is_read
    object.read?
  end

  def read_at
    object.read_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
