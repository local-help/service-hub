class NotificationPolicy < ApplicationPolicy
  def index?
    true
  end

  def update?
    owner?
  end

  class Scope < Scope
    def resolve
      scope.where(user_id: user.id)
    end
  end
end

