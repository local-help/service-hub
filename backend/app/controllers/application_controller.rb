class ApplicationController < ActionController::API
  include Authenticatable
  include Authorizable

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from ActionController::ParameterMissing, with: :bad_request
  rescue_from DomainError, with: :unprocessable_domain_error
  rescue_from Dry::Types::ConstraintError, with: :unprocessable_domain_error

  private

  def not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end

  def unprocessable_entity(exception)
    render json: { error: exception.record.errors.full_messages.join(', ') }, status: :unprocessable_entity
  end

  def unprocessable_domain_error(exception)
    render json: { error: exception.message }, status: :unprocessable_entity
  end

  def bad_request(exception)
    render json: { error: exception.message }, status: :bad_request
  end

  def paginate(scope)
    scope.page(params[:page]).per(params[:per_page] || 20)
  end
end
