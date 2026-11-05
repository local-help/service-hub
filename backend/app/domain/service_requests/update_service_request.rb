# frozen_string_literal: true

module ServiceRequests
  class UpdateServiceRequest
    include Callable

    attr_reader :service_request, :user, :params

    def initialize(service_request:, user:, params:)
      @service_request = service_request.is_a?(ServiceRequest) ? service_request : ServiceRequest.find(service_request)
      @user = user
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
    end

    def call
      ActiveRecord::Base.transaction do
        target_status = params[:status]
        admin_notes = params[:admin_notes]

        if target_status.present? && target_status != service_request.status
          service_request.transition_to!(
            target_status,
            changed_by: user,
            notes: admin_notes
          )
        end

        service_request.update!(admin_notes: admin_notes) if admin_notes.present?

        if user&.admin_or_super_admin?
          AdminActivityLog.log!(
            admin: user,
            action: 'update_request',
            entity: service_request,
            metadata: { status: service_request.status, notes: admin_notes }
          )
        end
      end

      service_request
    end
  end
end
