module Auth
  class LogoutService < ApplicationService
    def initialize(user, raw_token = nil)
      @user = user
      @raw_token = raw_token
    end

    def call
      if @raw_token.present?
        token_digest = Digest::SHA256.hexdigest(@raw_token)
        @user.refresh_tokens.find_by(token_digest: token_digest)&.revoke!
      else
        @user.refresh_tokens.active.update_all(revoked_at: Time.current)
      end

      success
    end
  end
end

