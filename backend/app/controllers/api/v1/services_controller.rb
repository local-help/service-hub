module Api
  module V1
    class ServicesController < ApplicationController
      skip_before_action :authenticate_user!

      def index
        services = Service.active.sorted.includes(:category, :subcategory)
        services = services.where(booking_type: 'fixed_price') unless params[:include_all].to_s == 'true'
        services = services.by_category(params[:category_id]) if params[:category_id].present?
        services = services.by_subcategory(params[:subcategory_id]) if params[:subcategory_id].present?
        services = services.for_vehicle_type(params[:vehicle_type]) if params[:vehicle_type].present?
        services = services.search(params[:q]) if params[:q].present?
        services = paginate(services)
        render json: services, each_serializer: ServiceSerializer, meta: pagination_meta(services)
      end

      def show
        service = find_service
        render json: service, serializer: ServiceDetailSerializer
      end

      # Dynamic calculation for variants & time-based bookings
      def calculate_price
        service = find_service
        variant = params[:variant_id].present? ? service.variants.find_by(id: params[:variant_id]) : service.variants.first
        pricing = variant&.current_pricing

        if service.booking_type_fixed_price?
          price = variant&.primary_price || service.fixed_price
          render json: {
            booking_type: 'fixed_price',
            total_price: price&.to_f,
            currency: 'INR',
            variant_name: variant&.name
          }
        elsif service.booking_type_time_based?
          hours = (params[:hours] || 8).to_i
          extends_past_night = params[:extends_past_night].to_s == 'true'
          night_hours = (params[:night_hours] || 0).to_i

          total = if pricing
                    pricing.calculate_tariff(duration_hours: hours, extends_past_night: extends_past_night,
                                             night_hours: night_hours)
                  else
                    service.fixed_price || 0
                  end

          render json: {
            booking_type: 'time_based',
            duration_hours: hours,
            extends_past_night: extends_past_night,
            night_hours: night_hours,
            total_price: total.to_f,
            currency: 'INR',
            pricing_rules: pricing&.applicable_conditions || {}
          }
        else
          render json: {
            booking_type: 'quotation',
            total_price: nil,
            requires_quote: true,
            message: 'Price will be quoted by our customer care desk after reviewing your requirements.'
          }
        end
      end

      private

      def find_service
        Service.active.find_by(slug: params[:id]) || Service.active.find(params[:id])
      end

      def skip_authorization?
        true
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end
    end
  end
end
