class ProviderAssignmentPolicy < ApplicationPolicy
  def show?
    admin? || (user.provider? && record.provider_id == user.service_provider&.id)
  end

  def accept?
    user.provider? && record.provider_id == user.service_provider&.id && user.service_provider&.eligible_for_assignment? && record.can_accept?
  end

  def reject?
    user.provider? && record.provider_id == user.service_provider&.id && record.can_reject?
  end

  def start_service?
    user.provider? && record.provider_id == user.service_provider&.id && record.can_start?
  end

  def complete?
    user.provider? && record.provider_id == user.service_provider&.id && record.can_complete?
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
        scope.none
      end
    end
  end
end

