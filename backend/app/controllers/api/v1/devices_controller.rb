module Api
  module V1
    class DevicesController < ApplicationController
      def create
        device = current_user.device_tokens.find_or_initialize_by(token: params[:token])
        device.platform = params[:platform] || 'web'
        device.active = true
        device.save!
        render json: { message: 'Device token registered' }, status: :created
      end

      def destroy
        device = current_user.device_tokens.find_by(token: params[:id])
        device&.destroy
        render json: { message: 'Device token removed' }
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
