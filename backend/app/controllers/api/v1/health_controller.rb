module Api
  module V1
    class HealthController < ApplicationController
      skip_before_action :authenticate_user!

      def show
        render json: {
          status: 'ok',
          timestamp: Time.current.iso8601,
          version: '1.0.0',
          database: database_connected?
        }
      end

      private

      def database_connected?
        ActiveRecord::Base.connection_pool.with_connection { |conn| conn.execute("SELECT 1") }
        true
      rescue StandardError
        false
      end

      def skip_authorization?
        true
      end
    end
  end
end

