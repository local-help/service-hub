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

