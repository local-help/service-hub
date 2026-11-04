module Api
  module V1
    module Admin
      class PlatformSettingsController < ApplicationController
        before_action :require_super_admin!

        def index
          settings = PlatformSetting.all.order(:key)
          render json: settings, each_serializer: PlatformSettingSerializer
        end

        def update
          setting = PlatformSetting.find_by!(key: params[:key])
          if setting.update(value: params[:value].to_s)
            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_platform_setting',
              entity: setting,
              metadata: { key: setting.key, value: setting.value }
            )
            render json: setting, serializer: PlatformSettingSerializer
          else
            render json: { error: setting.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end

