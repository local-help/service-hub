module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    token = extract_token
    raise AuthenticationError, 'Missing authentication token' unless token

    payload = JsonWebToken.decode(token)
    @current_user = User.find_by(id: payload[:sub])
    raise AuthenticationError, 'User not found' unless @current_user
    raise AuthenticationError, 'Account is inactive' unless @current_user.status_active?

    Current.user = @current_user
  rescue AuthenticationError => e
    render json: { error: e.message }, status: :unauthorized
  end

  def current_user
    @current_user
  end

  def extract_token
    header = request.headers['Authorization']
    header&.split(' ')&.last
  end
end

