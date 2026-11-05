require 'net/http'
require 'json'
require 'uri'
require 'jwt'

module Auth
  class GoogleAuthService < ApplicationService
    def initialize(params, request = nil)
      @params = params
      @request = request
    end

    def call
      id_token = @params[:id_token]
      payload = nil

      if id_token.present?
        payload = verify_google_id_token(id_token)
      elsif Rails.env.development? || Rails.env.test?
        # In development / test, allow simulated sign in if direct profile passed
        payload = simulated_dev_payload
      end

      return failure(payload&.dig(:error) || 'Missing Google credentials') if payload.blank? || payload[:error].present?

      email = payload[:email].to_s.downcase.strip
      return failure('Google account does not have a verified email') if email.blank?

      google_uid = payload[:google_uid].to_s.presence
      name = payload[:name].presence || email.split('@').first.to_s.titleize
      avatar_url = payload[:avatar_url].presence

      user = User.find_by(google_uid: google_uid) if google_uid.present?
      user ||= User.find_by(email: email)

      is_new_user = user.nil?

      if user
        user.google_uid ||= google_uid if google_uid.present?
        user.email_verified = true
        user.avatar_url = avatar_url if user.avatar_url.blank? && avatar_url.present?
        user.name = name if user.name.blank? && name.present?
        user.save! if user.changed?
      else
        user = User.new(
          name: name,
          email: email,
          google_uid: google_uid,
          email_verified: true,
          avatar_url: avatar_url,
          role: 'customer',
          status: 'active'
        )
        unless user.save
          return failure(user.errors.full_messages.join(', '))
        end
        NotificationService.notify_welcome(user)
      end

      unless user.status_active?
        return failure('Account is inactive or suspended')
      end

      access_token = JsonWebToken.generate_access_token(user)
      refresh_token = JsonWebToken.generate_refresh_token(user, @request)

      success(
        user: user,
        access_token: access_token,
        refresh_token: refresh_token,
        is_new_user: is_new_user
      )
    rescue StandardError => e
      Rails.logger.error("[GoogleAuthService] Error: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
      failure("Google authentication failed: #{e.message}")
    end

    private

    def verify_google_id_token(id_token)
      # 1. First attempt verification with Google tokeninfo endpoint
      begin
        uri = URI("https://oauth2.googleapis.com/tokeninfo?id_token=#{CGI.escape(id_token)}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 5

        res = http.get(uri.request_uri)
        if res.is_a?(Net::HTTPSuccess)
          data = JSON.parse(res.body)

          # Verify client id if configured
          google_client_id = ENV['GOOGLE_CLIENT_ID'] || ENV['NEXT_PUBLIC_GOOGLE_CLIENT_ID']
          if google_client_id.present? && data['aud'] != google_client_id
            return { error: 'Google ID token audience mismatch' }
          end

          return {
            google_uid: data['sub'],
            email: data['email'],
            name: data['name'] || "#{data['given_name']} #{data['family_name']}".strip,
            avatar_url: data['picture'],
            email_verified: data['email_verified'] == true || data['email_verified'] == 'true'
          }
        end
      rescue StandardError => e
        Rails.logger.warn("[GoogleAuthService] Google tokeninfo network check failed: #{e.message}")
      end

      # 2. In development or test, allow decoding valid unverified JWT structure
      if Rails.env.development? || Rails.env.test?
        begin
          decoded = JWT.decode(id_token, nil, false).first
          if decoded && decoded['email'].present?
            return {
              google_uid: decoded['sub'],
              email: decoded['email'],
              name: decoded['name'] || decoded['email'].split('@').first.titleize,
              avatar_url: decoded['picture'],
              email_verified: true
            }
          end
        rescue StandardError => e
          Rails.logger.warn("[GoogleAuthService] JWT decode fallback failed: #{e.message}")
        end

        # Check if direct profile was provided
        if @params[:email].present?
          return simulated_dev_payload
        end
      end

      { error: 'Invalid Google token' }
    end

    def simulated_dev_payload
      email = @params[:email]
      return nil if email.blank?

      {
        google_uid: @params[:google_uid] || "google_dev_#{Digest::MD5.hexdigest(email)}",
        email: email,
        name: @params[:name] || email.split('@').first.titleize,
        avatar_url: @params[:avatar_url] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
        email_verified: true
      }
    end
  end
end

