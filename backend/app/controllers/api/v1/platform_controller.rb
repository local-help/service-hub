module Api
  module V1
    class PlatformController < ApplicationController
      skip_before_action :authenticate_user!

      def support_info
        render json: {
          phone: PlatformSetting.get('support_phone', default: ENV['SUPPORT_PHONE'] || '+911234567890'),
          whatsapp: PlatformSetting.get('support_whatsapp', default: ENV['SUPPORT_WHATSAPP'] || '+911234567890'),
          platform_name: PlatformSetting.get('platform_name', default: ENV.fetch('PLATFORM_NAME', 'LocalHelp'))
        }
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
