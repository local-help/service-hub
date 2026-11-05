# frozen_string_literal: true

module ServiceRequests
  class UpdateServiceRequest
    include Callable
    extend Dry::Initializer

    option :service_request, type: Types::Instance(ServiceRequest)
    option :user, type: Types.Instance(User).optional, optional: true
    option :params

    def call
      parsed_params = normalize_params(params)

      ActiveRecord::Base.transaction do
        target_status = parsed_params[:status]
        admin_notes = parsed_params[:admin_notes]

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

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
