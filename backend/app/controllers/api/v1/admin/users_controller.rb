module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :require_super_admin!

        def index
          users = User.where(role: %w[admin super_admin]).order(created_at: :desc)
          render json: users, each_serializer: UserSerializer
        end

        def invite
          result = Users::InviteAdminUser.call(
            inviter: current_user,
            params: params
          )

          render json: {
            user: UserSerializer.new(result[:user]).as_json,
            temp_password: result[:temp_password]
          }, status: :created
        end

        def update
          user = User.find(params[:id])

          ActiveRecord::Base.transaction do
            if params[:status].present?
              user.update!(status: params[:status])
            end
            if params[:role].present? && %w[admin super_admin customer].include?(params[:role])
              user.update!(role: params[:role])
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_user_role_status',
              entity: user,
              metadata: { role: user.role, status: user.status }
            )
          end

          render json: user, serializer: UserSerializer
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end

