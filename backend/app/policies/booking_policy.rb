class BookingPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    record_owner? || admin? || provider_assigned?
  end

  def create?
    user.present?
  end

  def update?
    admin?
  end

  def cancel?
    (record_owner? || admin?) && record.can_cancel?
  end

  def reschedule?
    (record_owner? || admin?) && record.can_reschedule?
  end

  def feedback?
    record_owner?
  end

  class Scope < Scope
    def resolve
      Bookings::ListBookings.base_scope(user, scope)
    end
  end

  private

  def record_owner?
    record.user_id == user.id || record.service_request&.user_id == user.id
  end

  def provider_assigned?
    return false unless user.provider? && user.service_provider.present?

    p_id = user.service_provider.id
    record.provider_id == p_id || record.provider_assignments.exists?(provider_id: p_id)
  end
end
