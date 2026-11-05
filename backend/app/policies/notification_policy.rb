class NotificationPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin? || owner?
  end

  def read?
    admin? || owner?
  end

  def update?
    admin? || owner?
  end

  def read_all?
    true
  end

  def unread_count?
    true
  end

  class Scope < Scope
    def resolve
      scope.where(user_id: user.id)
    end
  end
end
