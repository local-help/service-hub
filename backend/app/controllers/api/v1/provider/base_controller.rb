module Api
  module V1
    module Provider
      class BaseController < ApplicationController
        before_action :require_provider!

        private

        def current_provider
          @current_provider ||= current_user.service_provider
        end

        def current_provider_user
          @current_provider_user ||= current_user.active_provider_user
        end

        def require_manager!
          unless current_user.provider_manager?
            render json: { error: 'Manager or Owner permission required' }, status: :forbidden
            return false
          end
          true
        end

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
