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

          user = User.find_by(email: params[:email]) || User.find_by(phone: params[:phone])
          if user.nil?
            user = User.create!(
              name: params[:name],
              email: params[:email],
              phone: params[:phone],
              role: 'provider',
              password: params[:password] || SecureRandom.hex(8),
              status: 'active'
            )
          else
            user.update!(role: 'provider') unless user.admin_or_super_admin?
          end

          provider_user = current_provider.provider_users.find_or_initialize_by(user: user)
          provider_user.role = params[:role] || 'staff'
          provider_user.active = true
          provider_user.save!

          render json: {
            id: provider_user.id,
            user_id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
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

