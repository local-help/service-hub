# frozen_string_literal: true

module ProviderAssignments
  class AssignProvider
    include Callable

    attr_reader :target, :provider, :assigned_by, :notes

    def initialize(target:, provider:, assigned_by:, notes: nil)
      @target = target
      @provider = provider.is_a?(Provider) ? provider : Provider.find(provider)
      @assigned_by = assigned_by
      @notes = notes
    end

    def call
      assigned_by_user = assigned_by.is_a?(User) ? assigned_by : User.find_by(id: assigned_by)

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
          assignment = service_request.assign_provider!(provider, assigned_by: assigned_by_user, notes: notes)
          AdminActivityLog.log!(
            admin: assigned_by_user,
            action: 'assign_provider',
            entity: service_request,
            metadata: { provider_id: provider.id, provider_name: provider.name, notes: notes }
          )
        end

        if booking.present? && !service_request.present?
          booking.update!(
            provider: provider,
            assigned_by: assigned_by_user&.id,
            assigned_at: Time.current
          )
          assignment = booking.provider_assignments.create!(
            provider: provider,
            assigned_by: assigned_by_user,
            status: 'assigned',
            assigned_at: Time.current
          )
          AdminActivityLog.log!(
            admin: assigned_by_user,
            action: 'assign_provider',
            entity: booking,
            metadata: { provider_id: provider.id, provider_name: provider.name, notes: notes }
          )
        end
      end

      target_booking = booking || service_request&.booking
      NotificationService.notify_provider_assigned(target_booking, provider) if target_booking.present?

      assignment || booking
    end
  end
end
