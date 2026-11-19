# frozen_string_literal: true

module ServiceRequests
  class CreateServiceRequest
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :params
    option :attachments, optional: true

    def call
      parsed_params = normalize_params(params)
      raw_attachments = attachments || parsed_params[:attachments] || parsed_params.dig(:service_request, :attachments)

      service_id = parsed_params[:service_id] || parsed_params.dig(:service_request, :service_id)
      service = Service.find_by(id: service_id)
      raise DomainError, "Service ##{service_id} not found" unless service
      raise DomainError, "#{service.name} is coming soon and cannot be booked" if service.coming_soon?

      address_id = parsed_params[:address_id] || parsed_params.dig(:service_request, :address_id)
      address = user.addresses.find_by(id: address_id)
      raise DomainError, "Address ##{address_id} not found" unless address

      desc = parsed_params[:description] || parsed_params.dig(:service_request, :description)
      pref = parsed_params[:preferred_at] || parsed_params.dig(:service_request, :preferred_at)
      v_id = parsed_params[:service_variant_id] || parsed_params.dig(:service_request, :service_variant_id)
      v_type = parsed_params[:vehicle_type] || parsed_params.dig(:service_request, :vehicle_type)
      dur = parsed_params[:duration_hours] || parsed_params.dig(:service_request, :duration_hours)
      opts = parsed_params[:selected_options] || parsed_params.dig(:service_request, :selected_options) || {}
      variant = v_id.present? ? service.variants.find_by(id: v_id) : nil

      service_request = user.service_requests.build(
        service: service,
        service_variant: variant,
        address: address,
        description: desc,
        preferred_at: pref,
        booking_type: service.booking_type,
        vehicle_type: v_type,
        duration_hours: dur,
        selected_options: opts
      )

      booking = nil
      ActiveRecord::Base.transaction do
        service_request.save!

        if raw_attachments.is_a?(Array)
          raw_attachments.each do |att|
            service_request.request_attachments.create!(
              file_url: att.is_a?(Hash) ? (att[:file_url] || att['file_url']) : att,
              file_name: att.is_a?(Hash) ? (att[:file_name] || att['file_name']) : nil,
              content_type: att.is_a?(Hash) ? (att[:content_type] || att['content_type']) : nil,
              file_size: att.is_a?(Hash) ? (att[:file_size] || att['file_size']) : nil
            )
          end
        end

        # Auto-create confirmed booking for all fixed-price customer bookings
        if service.booking_type_fixed_price? || service.booking_type_time_based? || true
          final_amount = parsed_params[:total_amount]&.to_f || variant&.price || service.fixed_price || 0.0
          booking = user.bookings.create!(
            service_request: service_request,
            service: service,
            service_variant: variant,
            address: address,
            description: desc,
            preferred_at: pref,
            scheduled_at: pref,
            status: 'confirmed',
            vehicle_type: v_type,
            duration_hours: dur,
            selected_options: opts,
            booking_type: 'direct',
            total_amount: final_amount
          )
          service_request.transition_to!('booking_confirmed', changed_by: user, notes: 'Auto-confirmed via fixed price service')
        end
      end

      if booking.present?
        NotificationService.notify_booking_confirmed(booking)
      else
        NotificationService.notify_request_submitted(service_request)
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
