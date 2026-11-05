# frozen_string_literal: true

module Providers
  class CreateProvider
    include Callable

    attr_reader :creator, :params

    def initialize(creator:, params:)
      @creator = creator
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      provider = ::Provider.new(provider_attributes)
      provider.name = params[:business_name] if provider.name.blank? && params[:business_name].present?

      ActiveRecord::Base.transaction do
        provider.save!

        # Default availability
        provider.create_availability!(
          is_available: true,
          operating_days: %w[monday tuesday wednesday thursday friday saturday sunday],
          working_hours_start: '08:00',
          working_hours_end: '20:00'
        )

        if params[:service_ids].is_a?(Array)
          params[:service_ids].each do |s_id|
            provider.provider_services.create!(service_id: s_id, active: true)
          end
        end

        # Optionally create owner user if user info passed
        if params[:user].present?
          user_params = params[:user]
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

    def provider_attributes
      params.slice(
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
