module Authorizable
  extend ActiveSupport::Concern

  included do
    include Pundit::Authorization
    after_action :verify_authorized_or_scoped, unless: :skip_authorization?

    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  end

  private

  def verify_authorized_or_scoped
    if action_name == 'index'
      verify_policy_scoped
    else
      verify_authorized
    end
  end

  def user_not_authorized(exception)
    render json: {
      error: 'You are not authorized to perform this action',
      detail: exception.message
    }, status: :forbidden
  end

  def skip_authorization?
    false
  end

  def require_admin!
    unless current_user&.admin_or_super_admin?
      render json: { error: 'Admin access required' }, status: :forbidden
    end
  end

  def require_super_admin!
    unless current_user&.super_admin?
      render json: { error: 'Super Admin access required' }, status: :forbidden
    end
  end

  def require_provider!
    unless current_user&.provider? && current_user.service_provider.present?
      render json: { error: 'Service Provider access required' }, status: :forbidden
      return false
    end

    provider = current_user.service_provider
    if provider.suspended?
      render json: { error: 'Your service provider account is suspended. Please contact support.', code: 'PROVIDER_SUSPENDED' }, status: :forbidden
      return false
    end

    if provider.verification_status == 'rejected'
      render json: { error: 'Your service provider application was rejected.', code: 'PROVIDER_REJECTED' }, status: :forbidden
      return false
    end

    true
  end

  def require_provider_manager!
    return false unless require_provider!

    unless current_user.provider_manager?
      render json: { error: 'Provider Manager or Owner access required' }, status: :forbidden
      return false
    end

    true
  end
end
