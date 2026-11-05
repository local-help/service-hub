# frozen_string_literal: true

module Providers
  class CreateProvider
    include Callable
    extend Dry::Initializer

    option :creator, type: Types.Instance(User).optional, optional: true
    option :params

    def call
      parsed_params = normalize_params(params)
      provider = ::Provider.new(provider_attributes(parsed_params))
      provider.name = parsed_params[:business_name] if provider.name.blank? && parsed_params[:business_name].present?

      ActiveRecord::Base.transaction do
        provider.save!

        # Default availability
        provider.create_availability!(
          is_available: true,
          operating_days: %w[monday tuesday wednesday thursday friday saturday sunday],
          working_hours_start: '08:00',
          working_hours_end: '20:00'
        )

        if parsed_params[:service_ids].is_a?(Array)
          parsed_params[:service_ids].each do |s_id|
            provider.provider_services.create!(service_id: s_id, active: true)
          end
        end

        # Optionally create owner user if user info passed
        if parsed_params[:user].present?
          user_params = parsed_params[:user]
          user = User.create!(
            name: user_params[:name],
            email: user_params[:email],
            phone: user_params[:phone],
            password: user_params[:password] || 'Provider@123456',
            role: 'provider',
            status: 'active'
          )
          provider.provider_users.create!(user: user, role: 'owner', active: true)
        end

        if creator&.admin_or_super_admin?
          AdminActivityLog.log!(
            admin: creator,
            action: 'create_provider',
            entity: provider,
            metadata: { name: provider.name, phone: provider.phone }
          )
        end
      end

      provider
    end

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end

    def provider_attributes(attrs)
      attrs.slice(
        :name, :business_name, :slug, :description,
        :phone, :email, :contact_person, :contact_phone, :contact_email,
        :address, :business_address, :city, :state, :postal_code,
        :service_area, :notes, :active,
        :verification_status, :operational_status, :onboarding_status,
        :suspension_reason
      )
    end
  end
end
