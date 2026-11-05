# frozen_string_literal: true

module Bookings
  class CreateBooking
    include Callable

    attr_reader :user, :params, :attachments

    def initialize(user:, params:, attachments: nil)
      @user = user
      @params = params.respond_to?(:to_unsafe_h) ? params.to_unsafe_h : params
      @params = @params.with_indifferent_access if @params.respond_to?(:with_indifferent_access)
      @attachments = attachments || @params[:attachments] || @params.dig(:booking, :attachments)
    end

    def call
      service_id = params[:service_id] || params.dig(:booking, :service_id)
      service = Service.find_by(id: service_id)
      raise DomainError, "Service ##{service_id} not found" unless service
      raise DomainError, "#{service.name} is coming soon and cannot be booked" if service.coming_soon?

      address_id = params[:address_id] || params.dig(:booking, :address_id)
      address = user.addresses.find_by(id: address_id)
      raise DomainError, "Address ##{address_id} not found" unless address

      desc = params[:description] || params.dig(:booking, :description)
      pref = params[:preferred_at] || params.dig(:booking, :preferred_at) || params[:scheduled_at]
      v_id = params[:service_variant_id] || params.dig(:booking, :service_variant_id)
      v_type = params[:vehicle_type] || params.dig(:booking, :vehicle_type)
      dur = params[:duration_hours] || params.dig(:booking, :duration_hours)
      opts = params[:selected_options] || params.dig(:booking, :selected_options) || {}

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

        if attachments.is_a?(Array)
          attachments.each do |att|
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
  end
end
