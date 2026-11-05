# frozen_string_literal: true

module Bookings
  class CreateBooking
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :params
    option :attachments, optional: true

    def call
      parsed_params = normalize_params(params)
      raw_attachments = attachments || parsed_params[:attachments] || parsed_params.dig(:booking, :attachments)

      service_id = parsed_params[:service_id] || parsed_params.dig(:booking, :service_id)
      service = Service.find_by(id: service_id)
      raise DomainError, "Service ##{service_id} not found" unless service
      raise DomainError, "#{service.name} is coming soon and cannot be booked" if service.coming_soon?

      address_id = parsed_params[:address_id] || parsed_params.dig(:booking, :address_id)
      address = user.addresses.find_by(id: address_id)
      raise DomainError, "Address ##{address_id} not found" unless address

      desc = parsed_params[:description] || parsed_params.dig(:booking, :description)
      pref = parsed_params[:preferred_at] || parsed_params.dig(:booking, :preferred_at) || parsed_params[:scheduled_at]
      v_id = parsed_params[:service_variant_id] || parsed_params.dig(:booking, :service_variant_id)
      v_type = parsed_params[:vehicle_type] || parsed_params.dig(:booking, :vehicle_type)
      dur = parsed_params[:duration_hours] || parsed_params.dig(:booking, :duration_hours)
      opts = parsed_params[:selected_options] || parsed_params.dig(:booking, :selected_options) || {}

      booking = user.bookings.build(
        service: service,
        address: address,
        description: desc,
        preferred_at: pref,
        scheduled_at: pref,
        service_variant_id: v_id,
        vehicle_type: v_type,
        duration_hours: dur,
        selected_options: opts,
        booking_type: service.booking_type,
        total_amount: service.fixed_price
      )

      ActiveRecord::Base.transaction do
        booking.save!

        if raw_attachments.is_a?(Array)
          raw_attachments.each do |att|
            booking.request_attachments.create!(
              file_url: att.is_a?(Hash) ? (att[:file_url] || att['file_url']) : att,
              file_name: att.is_a?(Hash) ? (att[:file_name] || att['file_name']) : nil,
              content_type: att.is_a?(Hash) ? (att[:content_type] || att['content_type']) : nil,
              file_size: att.is_a?(Hash) ? (att[:file_size] || att['file_size']) : nil
            )
          end
        end
      end

      NotificationService.notify_booking_confirmed(booking)
      booking
    end

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
