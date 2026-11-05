module Api
  module V1
    class NotificationsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:test_email], raise: false

      def index
        notifications = policy_scope(Notification).recent
        notifications = notifications.unread if params[:unread_only] == 'true' || params[:status] == 'unread'
        notifications = paginate(notifications)
        render json: notifications,
               each_serializer: NotificationSerializer,
               meta: pagination_meta(notifications).merge(unread_count: current_user.notifications.unread.count)
      end

      def unread_count
        skip_authorization
        render json: { unread_count: current_user.notifications.unread.count }
      end

      def read
        notification = current_user.notifications.find(params[:id])
        authorize notification, :read?
        notification.mark_read!
        render json: notification, serializer: NotificationSerializer
      end

      def read_all
        skip_authorization
        current_user.notifications.unread.update_all(read_at: Time.current)
        render json: { message: 'All notifications marked as read', unread_count: 0 }
      end

      def test_email
        skip_authorization

        email = params[:email].presence || current_user&.email
        unless email.present?
          render json: { error: 'Recipient email address is required' }, status: :unprocessable_entity
          return
        end

        subject = params[:subject] || 'Test Notification from Render'
        message = params[:message] || 'This is a test notification confirming email delivery is working properly from Render.'

        result = EmailService.send_test_email(email, subject, message)
        render json: {
          message: 'Test notification email dispatched successfully',
          recipient: email,
          delivery_info: result
        }
      rescue StandardError => e
        render json: { error: "Failed to send notification email: #{e.message}" }, status: :unprocessable_entity
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

