# frozen_string_literal: true

module Users
  class InviteAdminUser
    include Callable

    attr_reader :inviter, :params

    def initialize(inviter:, params:)
      @inviter = inviter
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      email = params[:email]&.downcase&.strip
      role = params[:role] || 'admin'
      raise DomainError, 'Invalid admin role' unless %w[admin super_admin].include?(role)

      temp_password = params[:password] || "Admin@#{SecureRandom.hex(4)}"
      user = User.new(
        name: params[:name] || 'Admin Member',
        email: email,
        phone: params[:phone],
        password: temp_password,
        role: role,
        status: 'active',
        email_verified: true
      )

      ActiveRecord::Base.transaction do
        user.save!

        AdminActivityLog.log!(
          admin: inviter,
          action: 'invite_admin_user',
          entity: user,
          metadata: { email: user.email, role: user.role }
        )
      end

      { user: user, temp_password: temp_password }
    end
  end
end
