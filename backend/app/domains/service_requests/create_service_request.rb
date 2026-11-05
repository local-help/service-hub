# frozen_string_literal: true

module ServiceRequests
  class CreateServiceRequest
    include Callable

    attr_reader :user, :params, :attachments

    def initialize(user:, params:, attachments: nil)
      @user = user
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
      @attachments = attachments || @params[:attachments] || @params.dig(:service_request, :attachments)
    end

    def call
      service_id = params[:service_id] || params.dig(:service_request, :service_id)
      service = Service.find_by(id: service_id)
      raise DomainError, "Service ##{service_id} not found" unless service

      address_id = params[:address_id] || params.dig(:service_request, :address_id)
      address = user.addresses.find_by(id: address_id)
      raise DomainError, "Address ##{address_id} not found" unless address

      desc = params[:description] || params.dig(:service_request, :description)
      pref = params[:preferred_at] || params.dig(:service_request, :preferred_at)
      v_id = params[:service_variant_id] || params.dig(:service_request, :service_variant_id)
      v_type = params[:vehicle_type] || params.dig(:service_request, :vehicle_type)
      dur = params[:duration_hours] || params.dig(:service_request, :duration_hours)
      opts = params[:selected_options] || params.dig(:service_request, :selected_options) || {}
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

        if attachments.is_a?(Array)
          attachments.each do |att|
            service_request.request_attachments.create!(
              file_url: att.is_a?(Hash) ? (att[:file_url] || att['file_url']) : att,
              file_name: att.is_a?(Hash) ? (att[:file_name] || att['file_name']) : nil,
              content_type: att.is_a?(Hash) ? (att[:content_type] || att['content_type']) : nil,
              file_size: att.is_a?(Hash) ? (att[:file_size] || att['file_size']) : nil
            )
          end
        end

        booking = service_request.create_booking!(
          user: user,
          service: service,
          service_variant: service_request.service_variant,
          address: address,
          reference_number: service_request.reference_number,
          description: service_request.description,
          preferred_at: service_request.preferred_at,
          scheduled_at: service_request.preferred_at || 1.day.from_now,
          booking_type: service.booking_type,
          vehicle_type: service_request.vehicle_type,
          duration_hours: service_request.duration_hours,
          selected_options: service_request.selected_options,
          status: service.fixed_price? ? 'confirmed' : 'pending_review'
        )
        service_request.update!(status: 'booking_confirmed') if service.fixed_price?

        service_request.request_attachments.update_all(booking_id: booking.id)

        StatusHistory.create!(
          entity_type: 'ServiceRequest',
          entity_id: service_request.id,
          previous_status: nil,
          new_status: service_request.status,
          changed_by: user.id,
          notes: 'Service request submitted by customer'
        )
      end

      if booking&.status == 'confirmed'
        NotificationService.notify_booking_confirmed(booking)
      else
        NotificationService.notify_request_submitted(service_request)
      end

      service_request
    end
  end
end
