class AddressPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    owner? || admin?
  end

  def create?
    true
  end

  def update?
    owner?
  end

  def destroy?
    owner?
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end
end

