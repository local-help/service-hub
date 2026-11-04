module Api
  module V1
    class NotificationsController < ApplicationController
      def index
        notifications = policy_scope(Notification).recent
        notifications = paginate(notifications)
        render json: notifications, each_serializer: NotificationSerializer, meta: pagination_meta(notifications)
      end

      def read
        notification = current_user.notifications.find(params[:id])
        authorize notification
        notification.mark_read!
        render json: notification, serializer: NotificationSerializer
      end

      def read_all
        current_user.notifications.unread.update_all(read_at: Time.current)
        render json: { message: 'All notifications marked as read' }
      end

      private

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end

