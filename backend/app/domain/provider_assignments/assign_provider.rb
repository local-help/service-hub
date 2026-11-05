# frozen_string_literal: true

module ProviderAssignments
  class AssignProvider
    include Callable
    extend Dry::Initializer

    option :target
    option :provider, type: Types.Instance(Provider)
    option :assigned_by, type: Types.Instance(User).optional, optional: true
    option :notes, optional: true

    def call
      service_request = if target.is_a?(ServiceRequest)
                          target
                        elsif target.respond_to?(:service_request) && target.service_request.present?
                          target.service_request
                        else
                          ServiceRequest.find_by(id: target)
                        end

      booking = if target.is_a?(Booking)
                  target
                elsif service_request.respond_to?(:booking)
                  service_request.booking
                else
                  Booking.find_by(id: target)
                end

      raise DomainError, 'Target service request or booking not found' unless service_request || booking

      assignment = nil
      ActiveRecord::Base.transaction do
        if service_request.present?
          assignment = service_request.assign_provider!(provider, assigned_by: assigned_by, notes: notes)
          AdminActivityLog.log!(
            admin: assigned_by,
            action: 'assign_provider',
            entity: service_request,
            metadata: { provider_id: provider.id, provider_name: provider.name, notes: notes }
          )
        end

        if booking.present? && service_request.blank?
          booking.update!(
            provider: provider,
            assigned_at: Time.current,
            assigned_by: assigned_by&.id
          )
          assignment = booking.provider_assignments.create!(
            provider: provider,
            assigned_by: assigned_by,
            status: 'assigned',
            assigned_at: Time.current,
            internal_notes: notes
          )
          AdminActivityLog.log!(
            admin: assigned_by,
            action: 'assign_provider',
            entity: booking,
            metadata: { provider_id: provider.id, provider_name: provider.name, notes: notes }
          )
        end
      end

      # Customer & Provider notification
      if booking.present?
        NotificationService.notify_provider_assigned(booking, provider)
      elsif service_request.present?
        NotificationService.notify_provider_users(
          provider,
          type: 'job_assigned',
          title: "New Job Request: #{service_request.service&.name}",
          body: "Request #{service_request.reference_number} in #{service_request.address&.city || 'Prayagraj'} assigned for review.",
          metadata: {
            service_request_id: service_request.id,
            reference_number: service_request.reference_number,
            action_url: '/provider/requests'
          }
        )
      end

      assignment
    end
  end
end
