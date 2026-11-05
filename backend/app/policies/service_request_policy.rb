class ServiceRequestPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    return true if admin?
    return true if owner?
    return true if user&.provider? && provider_assigned?

    false
  end

  def create?
    user.customer? || admin?
  end

  def update?
    admin?
  end

  def cancel?
    owner? || admin?
  end

  def assign_provider?
    admin?
  end

  private

  def provider_assigned?
    prov = user.service_provider
    return false unless prov.present? && prov.eligible_for_assignment?

    record.provider_assignments.exists?(provider_id: prov.id, status: %w[assigned accepted in_progress completed])
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      elsif user.provider?
        prov = user.service_provider
        return scope.none unless prov.present?

        scope.assigned_to_provider(prov.id)
      else
        scope.where(user_id: user.id)
      end
    end
  end
end
