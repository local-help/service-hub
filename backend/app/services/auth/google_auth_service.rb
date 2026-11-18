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
      code = @params[:code]
      payload = nil

      # 1. If authorization code is provided, exchange it for tokens with Google
      if code.present? && ENV['GOOGLE_CLIENT_SECRET'].present?
        redirect_uri = @params[:redirect_uri] || @request&.base_url || 'http://localhost:3000'
        token_res = exchange_code_for_tokens(code, redirect_uri)
        if token_res && token_res['id_token'].present?
          id_token = token_res['id_token']
        elsif token_res && token_res['error'].present?
          error_desc = token_res['error_description'] || token_res['error']
          return failure("Google OAuth error: #{error_desc}")
        end
      end

      # 2. Verify Google ID token
      if id_token.present?
        payload = verify_google_id_token(id_token)
      elsif allow_simulated_auth?
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
        return failure(user.errors.full_messages.join(', ')) unless user.save

        NotificationService.notify_welcome(user)
      end

      return failure('Account is inactive or suspended') unless user.status_active?

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

    def exchange_code_for_tokens(code, redirect_uri)
      uri = URI('https://oauth2.googleapis.com/token')
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 8
      http.read_timeout = 8

      client_id = ENV['GOOGLE_CLIENT_ID'] || ENV['NEXT_PUBLIC_GOOGLE_CLIENT_ID']
      client_secret = ENV['GOOGLE_CLIENT_SECRET']

      req = Net::HTTP::Post.new(uri.request_uri)
      req.set_form_data({
        'code' => code,
        'client_id' => client_id,
        'client_secret' => client_secret,
        'redirect_uri' => redirect_uri,
        'grant_type' => 'authorization_code'
      })

      res = http.request(req)
      JSON.parse(res.body)
    rescue StandardError => e
      Rails.logger.error("[GoogleAuthService] Code exchange network error: #{e.message}")
      nil
    end

    def verify_google_id_token(id_token)
      # 1. Primary verification: Official Google tokeninfo endpoint
      begin
        uri = URI("https://oauth2.googleapis.com/tokeninfo?id_token=#{CGI.escape(id_token)}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 5
        http.read_timeout = 5

        res = http.get(uri.request_uri)
        if res.is_a?(Net::HTTPSuccess)
          data = JSON.parse(res.body)

          # Verify client id audience if configured
          allowed_client_ids = [
            ENV['GOOGLE_CLIENT_ID'],
            ENV['GOOGLE_CLIENT_IDS']&.split(','),
            ENV['NEXT_PUBLIC_GOOGLE_CLIENT_ID'],
            ENV['EXPO_PUBLIC_GOOGLE_CLIENT_ID']
          ].flatten.compact.map(&:strip).reject(&:blank?)

          if allowed_client_ids.present? && !allowed_client_ids.include?(data['aud'])
            Rails.logger.warn("[GoogleAuthService] Token audience #{data['aud']} mismatch with allowed client IDs: #{allowed_client_ids}")
            return { error: 'Google ID token audience mismatch' }
          end

          return {
            google_uid: data['sub'],
            email: data['email'],
            name: data['name'] || "#{data['given_name']} #{data['family_name']}".strip,
            avatar_url: data['picture'],
            email_verified: [true, 'true'].include?(data['email_verified'])
          }
        else
          Rails.logger.warn("[GoogleAuthService] Google tokeninfo returned HTTP #{res.code}: #{res.body}")
        end
      rescue StandardError => e
        Rails.logger.warn("[GoogleAuthService] Google tokeninfo network check failed: #{e.message}")
      end

      # 2. In dev/test with unconfigured Google client ID, allow simulated fallback
      if allow_simulated_auth?
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

        return simulated_dev_payload if @params[:email].present?
      end

      { error: 'Invalid Google token' }
    end

    def allow_simulated_auth?
      ENV['ALLOW_DEV_GOOGLE_AUTH'] == 'true'
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
