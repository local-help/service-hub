module Auth
  class LoginService < ApplicationService
    def initialize(params)
      @email = params[:email]
      @password = params[:password]
    end

    def call
      user = User.find_by(email: @email&.downcase&.strip)
      unless user&.authenticate(@password)
        return failure('Invalid email or password')
      end

      unless user.status_active?
        return failure('Account is inactive or suspended')
      end

      access_token = JsonWebToken.generate_access_token(user)
      refresh_token = JsonWebToken.generate_refresh_token(user)
      success(user: user, access_token: access_token, refresh_token: refresh_token)
    end
  end
end

