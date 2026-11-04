class ProviderPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin?
  end

  def create?
    admin?
  end

  def update?
    admin?
  end

  class Scope < Scope
    def resolve
      if user.admin_or_super_admin?
        scope.all
      else
        scope.none
      end
    end
  end
end

