module Auth
  class RegisterService < ApplicationService
    def initialize(params)
      @params = params
    end

    def call
      user = User.new(@params)
      user.role = 'customer'
      user.status = 'active'

      if user.save
        access_token = JsonWebToken.generate_access_token(user)
        refresh_token = JsonWebToken.generate_refresh_token(user)
        success(user: user, access_token: access_token, refresh_token: refresh_token)
      else
        failure(user.errors.full_messages.join(', '))
      end
    end
  end
end

