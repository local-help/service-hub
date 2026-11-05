# frozen_string_literal: true

module Quotations
  class CreateQuotation
    include Callable
    extend Dry::Initializer

    option :created_by, type: Types.Instance(User)
    option :params
    option :provider, type: Types.Instance(Provider).optional, optional: true

    def call
      parsed_params = normalize_params(params)

      amount = (parsed_params[:amount] || parsed_params.dig(:quotation, :amount)).to_f
      raise DomainError, 'Valid amount greater than 0 is required' if amount <= 0

      description = parsed_params[:description] || parsed_params.dig(:quotation, :description)
      valid_until_param = parsed_params[:valid_until] || parsed_params.dig(:quotation, :valid_until)
      valid_until = valid_until_param.present? ? Time.zone.parse(valid_until_param.to_s) : 48.hours.from_now

      booking_id = parsed_params[:booking_id] || parsed_params.dig(:quotation, :booking_id)
      request_id = parsed_params[:service_request_id] || parsed_params.dig(:quotation, :service_request_id) || parsed_params[:id]

      booking = booking_id.present? ? Booking.find_by(id: booking_id) : nil
      service_request = request_id.present? ? ServiceRequest.find_by(id: request_id) : booking&.service_request
      booking ||= service_request&.booking

      if service_request&.quotation.present? && service_request.quotation.status.in?(%w[draft submitted pending approved])
        raise DomainError, 'A quotation already exists for this service request'
      end

      assignment = if provider.present?
                     provider.provider_assignments.find_by(service_request_id: service_request&.id) ||
                       provider.provider_assignments.find_by(booking_id: booking&.id)
                   end

      initial_status = parsed_params[:status] || (created_by&.admin_or_super_admin? ? 'pending' : 'submitted')

      quotation = nil
      ActiveRecord::Base.transaction do
        quotation = Quotation.create!(
          service_request: service_request,
          booking: booking,
          provider: provider,
          provider_assignment: assignment,
          amount: amount,
          description: description,
          valid_until: valid_until,
          status: initial_status,
          created_by: created_by.id
        )

        if initial_status == 'submitted'
          quotation.submit!(by_user: created_by)
        elsif service_request.present? && service_request.can_transition_to?('quotation_sent')
          service_request.transition_to!('quotation_sent', changed_by: created_by, notes: "Quotation created for #{quotation.amount}")
        end

        if created_by&.admin_or_super_admin?
          AdminActivityLog.log!(
            admin: created_by,
            action: 'create_quotation',
            entity: quotation,
            metadata: {
              amount: quotation.amount.to_f,
              service_request_id: service_request&.id,
              booking_id: booking&.id
            }
          )
        end
      end

      NotificationService.notify_quotation_received(quotation)
      quotation
    end

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
