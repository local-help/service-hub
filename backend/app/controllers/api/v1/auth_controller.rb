module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:register, :login, :send_otp, :verify_otp, :refresh, :reset_password]

      def register
        result = Auth::RegisterService.call(register_params)
        if result.success?
          render json: {
            message: 'Registration successful',
            user: UserSerializer.new(result.user).as_json,
            access_token: result.access_token,
            refresh_token: result.refresh_token
          }, status: :created
        else
          render json: { error: result.error }, status: :unprocessable_entity
        end
      end

      def login
        result = Auth::LoginService.call(login_params)
        if result.success?
          render json: {
            user: UserSerializer.new(result.user).as_json,
            access_token: result.access_token,
            refresh_token: result.refresh_token
          }
        else
          render json: { error: result.error }, status: :unauthorized
        end
      end

      def send_otp
        result = Auth::OtpSendService.call(params[:phone])
        if result.success?
          render json: {
            message: 'OTP sent successfully',
            cooldown: result.cooldown
          }
        else
          render json: { error: result.error }, status: :unprocessable_entity
        end
      end

      def verify_otp
        result = Auth::OtpVerifyService.call(
          phone: params[:phone],
          otp: params[:otp],
          request: request
        )
        if result.success?
          render json: {
            user: UserSerializer.new(result.user).as_json,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            is_new_user: result.is_new_user
          }
        else
          render json: { error: result.error }, status: :unauthorized
        end
      end

      def refresh
        result = Auth::TokenRefreshService.call(params[:refresh_token], request)
        if result.success?
          render json: {
            access_token: result.access_token,
            refresh_token: result.refresh_token
          }
        else
          render json: { error: result.error }, status: :unauthorized
        end
      end

      def logout
        Auth::LogoutService.call(current_user, params[:refresh_token])
        render json: { message: 'Logged out successfully' }
      end

      def me
        render json: { user: UserSerializer.new(current_user).as_json }
      end

      def update_profile
        if current_user.update(profile_params)
          render json: { user: UserSerializer.new(current_user).as_json }
        else
          render json: { error: current_user.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def reset_password
        render json: { message: 'Password reset instructions sent' }
      end

      def change_password
        if current_user.authenticate(params[:current_password])
          if current_user.update(password: params[:new_password])
            current_user.refresh_tokens.update_all(revoked_at: Time.current)
            render json: { message: 'Password changed successfully' }
          else
            render json: { error: current_user.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        else
          render json: { error: 'Current password is incorrect' }, status: :unauthorized
        end
      end

      private

      def register_params
        params.permit(:name, :email, :phone, :password)
      end

      def login_params
        params.permit(:email, :password)
      end

      def profile_params
        params.permit(:name, :email, :avatar_url)
      end

      def skip_authorization?
        true
      end
    end
  end
end

