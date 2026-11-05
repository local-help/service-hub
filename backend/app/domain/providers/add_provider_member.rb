# frozen_string_literal: true

module Providers
  class AddProviderMember
    include Callable

    attr_reader :provider, :actor, :params

    def initialize(provider:, actor:, params:)
      @provider = provider.is_a?(::Provider) ? provider : ::Provider.find(provider)
      @actor = actor
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      email = params[:email]&.strip
      phone = params[:phone]&.strip

      user = User.find_by(email: email) if email.present?
      user ||= User.find_by(phone: phone) if phone.present?

      if user.nil?
        user = User.create!(
          name: params[:name] || 'Team Member',
          email: email,
          phone: phone,
          role: 'provider',
          password: params[:password] || 'Provider@123456',
          status: 'active'
        )
      else
        user.update!(role: 'provider') unless user.admin_or_super_admin?
      end

      provider_user = provider.provider_users.find_or_initialize_by(user: user)
      provider_user.role = params[:role] || 'staff'
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
  end
end
