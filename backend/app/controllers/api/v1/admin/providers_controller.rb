module Api
  module V1
    module Admin
      class ProvidersController < ApplicationController
        before_action :require_admin!

        def index
          providers = ::Provider.includes(:services, :availability).order(created_at: :desc)
          providers = providers.search(params[:q]) if params[:q].present?
          providers = providers.by_city(params[:city]) if params[:city].present?
          providers = providers.where(active: params[:active]) if params[:active].present?
          providers = providers.where(verification_status: params[:verification_status]) if params[:verification_status].present?
          providers = providers.where(operational_status: params[:operational_status]) if params[:operational_status].present?

          providers = paginate(providers)
          render json: providers, each_serializer: ProviderSerializer, meta: pagination_meta(providers)
        end

        def show
          provider = ::Provider.find(params[:id])
          render json: provider, serializer: ProviderSerializer
        end

        def eligible
          service_id = params[:service_id]
          providers = ::Provider.eligible_for_assignment
          providers = providers.for_service(service_id) if service_id.present?
          providers = providers.by_city(params[:city]) if params[:city].present?

          render json: providers, each_serializer: ProviderSerializer
        end

        def create
          provider = Providers::CreateProvider.call(
            creator: current_user,
            params: params
          )

          render json: provider, serializer: ProviderSerializer, status: :created
        end

        def update
          provider = ::Provider.find(params[:id])

          ActiveRecord::Base.transaction do
            provider.update!(provider_params)

            if params[:service_ids].is_a?(Array)
              provider.provider_services.destroy_all
              params[:service_ids].each do |s_id|
                provider.provider_services.create!(service_id: s_id, active: true)
              end
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_provider',
              entity: provider,
              metadata: { active: provider.active, operational_status: provider.operational_status }
            )
          end

          render json: provider, serializer: ProviderSerializer
        end

        def verify
          provider = ::Provider.find(params[:id])
          provider.verify!(by_user: current_user)

          AdminActivityLog.log!(
            admin: current_user,
            action: 'verify_provider',
            entity: provider,
            metadata: { verification_status: 'verified' }
          )

          render json: provider, serializer: ProviderSerializer
        end

        def reject_verification
          provider = ::Provider.find(params[:id])
          reason = params[:reason] || 'Verification criteria not met'
          provider.reject_verification!(reason: reason, by_user: current_user)

          AdminActivityLog.log!(
            admin: current_user,
            action: 'reject_provider_verification',
            entity: provider,
            metadata: { reason: reason }
          )

          render json: provider, serializer: ProviderSerializer
        end

        def suspend
          provider = ::Provider.find(params[:id])
          reason = params[:reason] || 'Suspended by administrator'
          provider.suspend!(reason: reason, by_user: current_user)

          AdminActivityLog.log!(
            admin: current_user,
            action: 'suspend_provider',
            entity: provider,
            metadata: { reason: reason }
          )

          render json: provider, serializer: ProviderSerializer
        end

        def activate
          provider = ::Provider.find(params[:id])
          provider.activate!

          AdminActivityLog.log!(
            admin: current_user,
            action: 'activate_provider',
            entity: provider,
            metadata: { operational_status: 'active' }
          )

          render json: provider, serializer: ProviderSerializer
        end

        def deactivate
          provider = ::Provider.find(params[:id])
          provider.deactivate!

          AdminActivityLog.log!(
            admin: current_user,
            action: 'deactivate_provider',
            entity: provider,
            metadata: { operational_status: 'inactive' }
          )

          render json: provider, serializer: ProviderSerializer
        end

        def users
          provider = ::Provider.find(params[:id])
          provider_users = provider.provider_users.includes(:user)

          render json: provider_users.map { |pu|
            {
              id: pu.id,
              user_id: pu.user_id,
              name: pu.user.name,
              email: pu.user.email,
              phone: pu.user.phone,
              role: pu.role,
              active: pu.active
            }
          }
        end

        def create_user
          provider = ::Provider.find(params[:id])

          provider_user = Providers::AddProviderMember.call(
            provider: provider,
            actor: current_user,
            params: params
          )

          render json: {
            id: provider_user.id,
            user_id: provider_user.user_id,
            name: provider_user.user.name,
            email: provider_user.user.email,
            phone: provider_user.user.phone,
            role: provider_user.role,
            active: provider_user.active
          }, status: :created
        end

        private

        def provider_params
          params.permit(
            :name, :business_name, :slug, :description,
            :phone, :email, :contact_person, :contact_phone, :contact_email,
            :address, :business_address, :city, :state, :postal_code,
            :service_area, :notes, :active,
            :verification_status, :operational_status, :onboarding_status,
            :suspension_reason
          )
        end

        def skip_authorization?
          true
        end

        def pagination_meta(collection)
          {
            current_page: collection.current_page,
            total_pages: collection.total_pages,
            total_count: collection.total_count
          }
        end
      end
    end
  end
end
