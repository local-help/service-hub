# == Schema Information
#
# Table name: admin_activity_logs
#
#  id            :bigint           not null, primary key
#  action        :string           not null
#  entity_type   :string
#  metadata      :jsonb
#  created_at    :datetime         not null
#  admin_user_id :bigint           not null
#  entity_id     :bigint
#
# Indexes
#
#  index_admin_activity_logs_on_admin_user_id              (admin_user_id)
#  index_admin_activity_logs_on_created_at                 (created_at)
#  index_admin_activity_logs_on_entity_type_and_entity_id  (entity_type,entity_id)
#
# Foreign Keys
#
#  fk_rails_...  (admin_user_id => users.id)
#
class AdminActivityLogSerializer < ActiveModel::Serializer
  attributes :id, :admin_user_id, :admin_name, :action, :entity_type, :entity_id, :metadata, :created_at

  def admin_name
    object.admin_user.name
  end

  def created_at
    object.created_at.iso8601
  end
end
