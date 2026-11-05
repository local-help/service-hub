# frozen_string_literal: true

module Users
  class InviteAdminUser
    include Callable
    extend Dry::Initializer

    option :inviter, type: Types.Instance(User)
    option :params

    def call
      parsed_params = normalize_params(params)
      email = parsed_params[:email]&.downcase&.strip
      role = parsed_params[:role] || 'admin'
      raise DomainError, 'Invalid admin role' unless %w[admin super_admin].include?(role)

      temp_password = parsed_params[:password] || "Admin@#{SecureRandom.hex(4)}"
      user = User.new(
        name: parsed_params[:name] || 'Admin Member',
        email: email,
        phone: parsed_params[:phone],
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

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
