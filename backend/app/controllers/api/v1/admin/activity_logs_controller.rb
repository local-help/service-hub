module Api
  module V1
    module Admin
      class ActivityLogsController < ApplicationController
        before_action :require_admin!

        def index
          logs = AdminActivityLog.includes(:admin_user).recent
          logs = logs.by_admin(params[:admin_id]) if params[:admin_id].present?
          logs = logs.where(action: params[:log_action]) if params[:log_action].present?
          logs = paginate(logs)
          render json: logs, each_serializer: AdminActivityLogSerializer, meta: pagination_meta(logs)
        end

        private

        def skip_authorization?
          true
        end

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
end

