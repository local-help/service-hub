# frozen_string_literal: true

class NotificationBroadcastJob < ApplicationJob
  queue_as :default

  def perform(target_type, target_id, payload = {})
    notification_type = payload[:type] || payload['type']
    title = payload[:title] || payload['title']
    body = payload[:body] || payload['body']
    metadata = payload[:metadata] || payload['metadata'] || {}

    case target_type.to_s
    when 'admins'
      User.admins.status_active.find_each do |admin|
        NotificationService.create_notification(
          user: admin,
          type: notification_type,
          title: title,
          body: body,
          metadata: metadata.reverse_merge('action_url' => '/admin')
        )
      end
    when 'provider'
      provider = Provider.find_by(id: target_id)
      return unless provider

      provider.users.find_each do |p_user|
        NotificationService.create_notification(
          user: p_user,
          type: notification_type,
          title: title,
          body: body,
          metadata: metadata.merge('provider_id' => provider.id)
        )
      end
    end
  rescue StandardError => e
    Rails.logger.error("[NotificationBroadcastJob] Error broadcasting #{notification_type} to #{target_type}: #{e.message}")
  end
end
