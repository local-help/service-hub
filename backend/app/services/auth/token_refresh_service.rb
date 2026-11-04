module Auth
  class TokenRefreshService < ApplicationService
    def initialize(raw_token, request = nil)
      @raw_token = raw_token
      @request = request
    end

    def call
      return failure('Refresh token is required') if @raw_token.blank?

      refresh_token = JsonWebToken.verify_refresh_token(@raw_token)
      user = refresh_token.user

      return failure('Account is inactive') unless user.status_active?

      # Revoke old token and issue new pair
      refresh_token.revoke!

      access_token = JsonWebToken.generate_access_token(user)
      new_refresh_token = JsonWebToken.generate_refresh_token(user, @request)

      success(access_token: access_token, refresh_token: new_refresh_token)
    rescue AuthenticationError => e
      failure(e.message)
    end
  end
end

