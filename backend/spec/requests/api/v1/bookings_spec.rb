# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Bookings', type: :request do
  let(:customer) { create(:user) }
  let(:other_customer) { create(:user) }
  let(:admin) { create(:user, :admin) }

  let!(:booking1) { create(:booking, user: customer, status: 'completed') }
  let!(:booking2) { create(:booking, user: customer, status: 'confirmed') }
  let!(:other_booking) { create(:booking, user: other_customer, status: 'completed') }

  describe 'GET /api/v1/bookings' do
    it 'returns bookings for current customer only' do
      get '/api/v1/bookings', headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)

      bookings = json_response.is_a?(Array) ? json_response : json_response[:bookings]
      ids = bookings.map { |b| b[:id] }
      expect(ids).to include(booking1.id, booking2.id)
      expect(ids).not_to include(other_booking.id)
    end

    it 'filters bookings by status' do
      get '/api/v1/bookings?status=completed', headers: auth_headers(customer)
      expect(response).to have_http_status(:ok)

      bookings = json_response.is_a?(Array) ? json_response : json_response[:bookings]
      ids = bookings.map { |b| b[:id] }
      expect(ids).to include(booking1.id)
      expect(ids).not_to include(booking2.id)
    end

    it 'allows admins to view all bookings across the platform' do
      get '/api/v1/bookings', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)

      bookings = json_response.is_a?(Array) ? json_response : json_response[:bookings]
      ids = bookings.map { |b| b[:id] }
      expect(ids).to include(booking1.id, booking2.id, other_booking.id)
    end
  end

  describe 'POST /api/v1/bookings/:id/feedback' do
    context 'when booking is completed and user is owner' do
      it 'records rating and feedback' do
        post "/api/v1/bookings/#{booking1.id}/feedback",
             params: { rating: 5, feedback: 'Service was great!' },
             headers: auth_headers(customer)

        expect(response).to have_http_status(:ok)
        expect(booking1.reload.rating).to eq(5)
        expect(booking1.feedback).to eq('Service was great!')
      end
    end

    context 'when booking is not completed' do
      it 'returns unprocessable entity' do
        post "/api/v1/bookings/#{booking2.id}/feedback",
             params: { rating: 4, feedback: 'Too early' },
             headers: auth_headers(customer)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'when user is not the booking owner' do
      it 'forbids feedback submission' do
        post "/api/v1/bookings/#{booking1.id}/feedback",
             params: { rating: 5 },
             headers: auth_headers(other_customer)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
