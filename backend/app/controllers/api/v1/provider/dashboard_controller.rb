module Api
  module V1
    module Provider
      class DashboardController < BaseController
        def show
          assignments = current_provider.provider_assignments

          stats = {
            pending_assignments_count: assignments.where(status: 'assigned').count,
            active_requests_count: assignments.where(status: %w[accepted in_progress]).count,
            completed_count: assignments.where(status: 'completed').count,
            rejected_count: assignments.where(status: 'rejected').count,
            services_count: current_provider.provider_services.where(active: true).count
          }

          recent = assignments.order(created_at: :desc).limit(5)

          render json: {
            provider: {
              id: current_provider.id,
              name: current_provider.name,
              contact_person: current_provider.contact_person,
              contact_phone: current_provider.contact_phone,
              contact_email: current_provider.contact_email,
              verification_status: current_provider.verification_status,
              operational_status: current_provider.operational_status,
              city: current_provider.city,
              eligible_for_assignment: current_provider.eligible_for_assignment?
            },
            user: {
              id: current_user.id,
              name: current_user.name,
              role: current_user.provider_role
            },
            stats: stats,
            availability: current_provider.availability ? ProviderAvailabilitySerializer.new(current_provider.availability).as_json : nil,
            recent_assignments: ActiveModelSerializers::SerializableResource.new(
              recent,
              each_serializer: ProviderAssignmentSerializer
            ).as_json
          }
        end
      end
    end
  end
end

