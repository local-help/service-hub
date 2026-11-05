module Api
  module V1
    module Provider
      class ProfileController < BaseController
        before_action :require_manager!, only: [:update]

        def show
          render json: current_provider, serializer: ProviderSerializer
        end

        def update
          current_provider.update!(profile_params)
          render json: current_provider, serializer: ProviderSerializer
        end

        def team
          team_members = current_provider.provider_users.includes(:user)

          render json: team_members.map { |pu|
            {
              id: pu.id,
              user_id: pu.user_id,
              name: pu.user.name,
              email: pu.user.email,
              phone: pu.user.phone,
              role: pu.role,
              active: pu.active,
              joined_at: pu.created_at.iso8601
            }
          }
        end

        def invite_member
          unless current_user.provider_owner?
            render json: { error: 'Only provider owners can add team members' }, status: :forbidden
            return
          end

          provider_user = Providers::AddProviderMember.call(
            provider: current_provider,
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

        def profile_params
          params.permit(:description, :contact_person, :contact_phone, :contact_email, :business_address, :address, :city, :state, :postal_code, :notes)
        end
      end
    end
  end
end

