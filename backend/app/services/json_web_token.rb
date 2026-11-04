class JsonWebToken
  SECRET_KEY = ENV.fetch('JWT_SECRET_KEY') { Rails.application.secret_key_base }
  ACCESS_TOKEN_EXPIRY = ENV.fetch('JWT_ACCESS_TOKEN_EXPIRY', 900).to_i
  REFRESH_TOKEN_EXPIRY = ENV.fetch('JWT_REFRESH_TOKEN_EXPIRY', 2_592_000).to_i

  class << self
    def encode(payload, exp = ACCESS_TOKEN_EXPIRY)
      payload = payload.dup
      payload[:exp] = exp.seconds.from_now.to_i
      payload[:iat] = Time.current.to_i
      payload[:jti] = SecureRandom.uuid
      JWT.encode(payload, SECRET_KEY, 'HS256')
    end

    def decode(token)
      decoded = JWT.decode(token, SECRET_KEY, true, {
        algorithm: 'HS256',
        verify_expiration: true
      })
      ActiveSupport::HashWithIndifferentAccess.new(decoded.first)
    rescue JWT::ExpiredSignature
      raise AuthenticationError, 'Token has expired'
    rescue JWT::DecodeError => e
      raise AuthenticationError, "Invalid token: #{e.message}"
    end

    def generate_access_token(user)
      encode({ sub: user.id, role: user.role }, ACCESS_TOKEN_EXPIRY)
    end

    def generate_refresh_token(user, request = nil)
      raw_token = SecureRandom.hex(32)
      token_digest = Digest::SHA256.hexdigest(raw_token)

      user.refresh_tokens.create!(
        token_digest: token_digest,
        expires_at: REFRESH_TOKEN_EXPIRY.seconds.from_now,
        device_info: request&.user_agent,
        ip_address: request&.remote_ip
      )

      raw_token
    end

    def verify_refresh_token(raw_token)
      token_digest = Digest::SHA256.hexdigest(raw_token)
      refresh_token = RefreshToken.active.find_by(token_digest: token_digest)
      raise AuthenticationError, 'Invalid or expired refresh token' unless refresh_token
      refresh_token
    end
  end
end

class AuthenticationError < StandardError; end

