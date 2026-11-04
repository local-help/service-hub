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

