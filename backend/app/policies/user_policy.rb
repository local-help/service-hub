class UserPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    record.id == user.id || admin?
  end

  def create?
    super_admin?
  end

  def update?
    record.id == user.id || super_admin?
  end

  def invite?
    super_admin?
  end

  class Scope < Scope
    def resolve
      if user.super_admin?
        scope.all
      elsif user.admin?
        scope.where(role: 'customer')
      else
        scope.where(id: user.id)
      end
    end
  end
end

