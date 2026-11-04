module Api
  module V1
    class AddressesController < ApplicationController
      def index
        addresses = policy_scope(Address).where(user_id: current_user.id).default_first
        render json: addresses, each_serializer: AddressSerializer
      end

      def show
        address = current_user.addresses.find(params[:id])
        authorize address
        render json: address, serializer: AddressSerializer
      end

      def create
        address = current_user.addresses.build(address_params)
        authorize address
        if address.save
          render json: address, serializer: AddressSerializer, status: :created
        else
          render json: { error: address.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        address = current_user.addresses.find(params[:id])
        authorize address
        if address.update(address_params)
          render json: address, serializer: AddressSerializer
        else
          render json: { error: address.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def destroy
        address = current_user.addresses.find(params[:id])
        authorize address
        if address.destroy
          render json: { message: 'Address deleted' }
        else
          render json: { error: address.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def address_params
        params.permit(:label, :address_line, :landmark, :city, :state, :postal_code,
                      :latitude, :longitude, :is_default)
      end
    end
  end
end

