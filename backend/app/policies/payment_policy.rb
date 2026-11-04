class PaymentPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record.booking.service_request.user_id == user.id || admin?
  end

  def create?
    true
  end

  def record_offline?
    admin?
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      else
        scope.joins(booking: :service_request).where(service_requests: { user_id: user.id })
      end
    end
  end
end

