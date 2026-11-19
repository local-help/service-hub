# frozen_string_literal: true

module Orders
  class CreateOrder
    include Callable
    extend Dry::Initializer

    option :user, type: Types.Instance(User)
    option :params
    option :attachments, optional: true

    def call
      parsed_params = normalize_params(params)
      raw_attachments = attachments || parsed_params[:attachments] || parsed_params.dig(:order, :attachments) || parsed_params.dig(:booking, :attachments)

      service_id = parsed_params[:service_id] || parsed_params.dig(:order, :service_id) || parsed_params.dig(:booking, :service_id)
      service = Service.find_by(id: service_id)
      raise DomainError, "Service ##{service_id} not found" unless service
      raise DomainError, "#{service.name} is coming soon and cannot be booked" if service.coming_soon?

      address_id = parsed_params[:address_id] || parsed_params.dig(:order, :address_id) || parsed_params.dig(:booking, :address_id)
      address = user.addresses.find_by(id: address_id)
      raise DomainError, "Address ##{address_id} not found" unless address

      desc = parsed_params[:description] || parsed_params.dig(:order, :description) || parsed_params.dig(:booking, :description)
      pref = parsed_params[:preferred_at] || parsed_params.dig(:order, :preferred_at) || parsed_params[:scheduled_at]
      v_id = parsed_params[:service_variant_id] || parsed_params.dig(:order, :service_variant_id) || parsed_params.dig(:booking, :service_variant_id)
      v_type = parsed_params[:vehicle_type] || parsed_params.dig(:order, :vehicle_type) || parsed_params.dig(:booking, :vehicle_type)
      dur = parsed_params[:duration_hours] || parsed_params.dig(:order, :duration_hours) || parsed_params.dig(:booking, :duration_hours)
      opts = parsed_params[:selected_options] || parsed_params.dig(:order, :selected_options) || parsed_params.dig(:booking, :selected_options) || {}
      variant = v_id.present? ? service.variants.find_by(id: v_id) : nil

      final_amount = parsed_params[:total_amount]&.to_f || variant&.price || service.fixed_price || 0.0

      order = user.bookings.build(
        service: service,
        service_variant: variant,
        address: address,
        description: desc,
        preferred_at: pref,
        scheduled_at: pref || 1.day.from_now,
        vehicle_type: v_type,
        duration_hours: dur,
        selected_options: opts,
        booking_type: service.booking_type || 'direct',
        total_amount: final_amount,
        status: 'pending_assignment'
      )

      ActiveRecord::Base.transaction do
        order.save!

        if raw_attachments.is_a?(Array)
          raw_attachments.each do |att|
            order.request_attachments.create!(
              file_url: att.is_a?(Hash) ? (att[:file_url] || att['file_url']) : att,
              file_name: att.is_a?(Hash) ? (att[:file_name] || att['file_name']) : nil,
              content_type: att.is_a?(Hash) ? (att[:content_type] || att['content_type']) : nil,
              file_size: att.is_a?(Hash) ? (att[:file_size] || att['file_size']) : nil
            )
          end
        end

        order.status_histories.create!(
          entity_type: 'Booking',
          previous_status: nil,
          new_status: 'pending_assignment',
          changed_by: user.id,
          notes: 'Order placed by customer - awaiting specialist assignment'
        )
      end

      NotificationService.notify_booking_confirmed(order)
      order
    end

    private

    def normalize_params(raw)
      p = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      p.respond_to?(:with_indifferent_access) ? p.with_indifferent_access : p
    end
  end
end
