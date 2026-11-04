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
          email = params[:email]&.downcase&.strip
          role = params[:role] || 'admin'

          unless %w[admin super_admin].include?(role)
            render json: { error: 'Invalid admin role' }, status: :unprocessable_entity
            return
          end

          temp_password = params[:password] || "Admin@#{SecureRandom.hex(4)}"
          user = User.new(
            name: params[:name] || 'Admin Member',
            email: email,
            phone: params[:phone],
            password: temp_password,
            role: role,
            status: 'active',
            email_verified: true
          )

          ActiveRecord::Base.transaction do
            user.save!

            AdminActivityLog.log!(
              admin: current_user,
              action: 'invite_admin_user',
              entity: user,
              metadata: { email: user.email, role: user.role }
            )
          end

          render json: {
            user: UserSerializer.new(user).as_json,
            temp_password: temp_password
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

