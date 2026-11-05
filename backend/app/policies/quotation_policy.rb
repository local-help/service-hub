class QuotationPolicy < ApplicationPolicy
  def show?
    return true if admin?
    return true if record.service_request.user_id == user.id
    return true if user.provider? && record.provider_id == user.service_provider&.id

    false
  end

  def create?
    return true if admin?
    return true if user.provider? && user.service_provider&.eligible_for_assignment?

    false
  end

  def update?
    return true if admin? && record.can_modify?
    return true if user.provider? && record.provider_id == user.service_provider&.id && record.can_modify?

    false
  end

  def approve?
    record.service_request.user_id == user.id
  end

  def reject?
    record.service_request.user_id == user.id
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      elsif user.provider?
        prov = user.service_provider
        return scope.none unless prov.present?

        scope.where(provider_id: prov.id)
      else
        scope.joins(:service_request).where(service_requests: { user_id: user.id })
      end
    end
  end
end
