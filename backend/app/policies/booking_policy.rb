class BookingPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record.service_request.user_id == user.id || admin?
  end

  def update?
    admin?
  end

  def cancel?
    (record.service_request.user_id == user.id || admin?) && record.can_cancel?
  end

  def reschedule?
    (record.service_request.user_id == user.id || admin?) && record.can_reschedule?
  end

  def feedback?
    record.service_request.user_id == user.id && record.status == 'completed'
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      else
        scope.joins(:service_request).where(service_requests: { user_id: user.id })
      end
    end
  end
end

