class AdminActivityLogSerializer < ActiveModel::Serializer
  attributes :id, :admin_user_id, :admin_name, :action, :entity_type, :entity_id, :metadata, :created_at

  def admin_name
    object.admin_user.name
  end

  def created_at
    object.created_at.iso8601
  end
end

