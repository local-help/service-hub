module Api
  module V1
    module Provider
      class AvailabilityController < BaseController
        before_action :require_manager!, only: [:update]

        def show
          availability = current_provider.availability || current_provider.create_availability!(
            is_available: true,
            operating_days: %w[monday tuesday wednesday thursday friday saturday sunday],
            working_hours_start: '08:00',
            working_hours_end: '20:00'
          )

          render json: availability, serializer: ProviderAvailabilitySerializer
        end

        def update
          availability = current_provider.availability || current_provider.build_availability

          availability.update!(availability_params)

          render json: availability, serializer: ProviderAvailabilitySerializer
        end

        private

        def availability_params
          params.permit(
            :is_available,
            :working_hours_start,
            :working_hours_end,
            :temporary_unavailability_start,
            :temporary_unavailability_end,
            :unavailability_reason,
            operating_days: []
          )
        end
      end
    end
  end
end

