# frozen_string_literal: true

module Providers
  class AddProviderMember
    include Callable
    extend Dry::Initializer

    option :provider, type: Types.Instance(::Provider)
    option :actor, type: Types.Instance(User).optional, optional: true
    option :params

    def call
      parsed_params = normalize_params(params)
      email = parsed_params[:email]&.strip
      phone = parsed_params[:phone]&.strip

      user = User.find_by(email: email) if email.present?
      user ||= User.find_by(phone: phone) if phone.present?

      if user.nil?
        user = User.create!(
          name: parsed_params[:name] || 'Team Member',
          email: email,
          phone: phone,
          role: 'provider',
          password: parsed_params[:password] || 'Provider@123456',
          status: 'active'
        )
      else
        user.update!(role: 'provider') unless user.admin_or_super_admin?
      end

      provider_user = provider.provider_users.find_or_initialize_by(user: user)
      provider_user.role = parsed_params[:role] || 'staff'
      provider_user.active = true
      provider_user.save!

      if actor&.admin_or_super_admin?
        AdminActivityLog.log!(
          admin: actor,
          action: 'create_provider_user',
          entity: provider,
          metadata: { user_id: user.id, email: user.email, role: provider_user.role }
        )
      end

      provider_user
    end

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
