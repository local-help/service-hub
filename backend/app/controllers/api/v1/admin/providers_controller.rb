module Api
  module V1
    module Admin
      class ProvidersController < ApplicationController
        before_action :require_admin!

        def index
          providers = Provider.includes(:services).order(created_at: :desc)
          providers = providers.search(params[:q]) if params[:q].present?
          providers = providers.by_city(params[:city]) if params[:city].present?
          providers = providers.where(active: params[:active]) if params[:active].present?
          providers = paginate(providers)
          render json: providers, each_serializer: ProviderSerializer, meta: pagination_meta(providers)
        end

        def show
          provider = Provider.find(params[:id])
          render json: provider, serializer: ProviderSerializer
        end

        def create
          provider = Provider.new(provider_params)

          ActiveRecord::Base.transaction do
            provider.save!

            if params[:service_ids].is_a?(Array)
              params[:service_ids].each do |s_id|
                provider.provider_services.create!(service_id: s_id)
              end
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'create_provider',
              entity: provider,
              metadata: { name: provider.name, phone: provider.phone }
            )
          end

          render json: provider, serializer: ProviderSerializer, status: :created
        end

        def update
          provider = Provider.find(params[:id])

          ActiveRecord::Base.transaction do
            provider.update!(provider_params)

            if params[:service_ids].is_a?(Array)
              provider.provider_services.destroy_all
              params[:service_ids].each do |s_id|
                provider.provider_services.create!(service_id: s_id)
              end
            end

            AdminActivityLog.log!(
              admin: current_user,
              action: 'update_provider',
              entity: provider,
              metadata: { active: provider.active }
            )
          end

          render json: provider, serializer: ProviderSerializer
        end

        private

        def provider_params
          params.permit(:name, :phone, :email, :address, :city, :service_area, :notes, :active)
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

