class QuotationPolicy < ApplicationPolicy
  def show?
    record.service_request.user_id == user.id || admin?
  end

  def create?
    admin?
  end

  def update?
    admin? && record.can_modify?
  end

  def approve?
    record.service_request.user_id == user.id
  end

  def reject?
    record.service_request.user_id == user.id
  end
end

