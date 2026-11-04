require 'rails_helper'

RSpec.describe 'Service Catalogue Hierarchy & Pricing', type: :request do
  let!(:customer) { create(:user, :customer) }
  let!(:super_admin) { create(:user, :super_admin) }

  let!(:category) { Category.create!(name: 'Vehicle Services', slug: 'vehicle-services', position: 1) }
  let!(:subcategory) { category.subcategories.create!(name: 'Car Services', slug: 'car-services', position: 1) }
  let!(:service) do
    subcategory.services.create!(
      category: category,
      name: 'Car Wash',
      slug: 'car-wash',
      booking_type: 'fixed_price',
      fixed_price: 299.0,
      supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
    )
  end
  let!(:variant) do
    service.variants.create!(
      name: 'Complete Car Wash - Hatchback',
      variant_attributes: { vehicle_types: ['hatchback'], package_type: 'complete_wash' },
      position: 1
    )
  end
  let!(:pricing) do
    variant.service_pricings.create!(
      price: 499.0,
      pricing_type: 'fixed',
      applicable_conditions: { base_price: 499.0 },
      active: true
    )
  end

  let!(:driver_subcat) { category.subcategories.create!(name: 'Driver Services', slug: 'driver-services', position: 2) }
  let!(:driver_service) do
    driver_subcat.services.create!(
      category: category,
      name: 'Hourly Driver',
      slug: 'hourly-driver',
      booking_type: 'time_based'
    )
  end
  let!(:driver_variant) do
    driver_service.variants.create!(name: 'Standard Driver Booking', position: 1)
  end
  let!(:driver_pricing) do
    driver_variant.service_pricings.create!(
      price: 800.0,
      pricing_type: 'time_based',
      applicable_conditions: {
        'base_hours' => 8,
        'base_price' => 800.0,
        'additional_hour_rate' => 50.0,
        'night_start_hour' => 22,
        'night_additional_hour_rate' => 100.0,
        'night_fixed_charge' => 300.0
      },
      active: true
    )
  end

  let!(:coming_soon_cat) { Category.create!(name: 'Emergency Assistance', slug: 'emergency-assistance', coming_soon: true) }
  let!(:ambulance_subcat) { coming_soon_cat.subcategories.create!(name: 'Emergency Medical', slug: 'emergency-medical') }
  let!(:ambulance_service) do
    ambulance_subcat.services.create!(
      category: coming_soon_cat,
      name: 'Ambulance Assistance',
      slug: 'ambulance-assistance',
      booking_type: 'quotation',
      coming_soon: true
    )
  end

  describe 'GET /api/v1/categories' do
    it 'returns categories with subcategories count' do
      get '/api/v1/categories'
      expect(response).to have_http_status(:ok)
      names = json_response.map { |c| c[:name] }
      expect(names).to include('Vehicle Services', 'Emergency Assistance')
    end
  end

  describe 'GET /api/v1/subcategories/:id' do
    it 'returns subcategory details and its services' do
      get "/api/v1/subcategories/#{subcategory.id}"
      expect(response).to have_http_status(:ok)
      expect(json_response[:subcategory][:name]).to eq('Car Services')
      expect(json_response[:services].first[:name]).to eq('Car Wash')
    end
  end

  describe 'GET /api/v1/services/:id' do
    it 'returns service with variants and pricing' do
      get "/api/v1/services/#{service.id}"
      expect(response).to have_http_status(:ok)
      expect(json_response[:name]).to eq('Car Wash')
      expect(json_response[:variants].first[:name]).to eq('Complete Car Wash - Hatchback')
      expect(json_response[:variants].first[:primary_price]).to eq(499.0)
    end
  end

  describe 'POST /api/v1/services/:id/calculate_price' do
    it 'calculates dynamic tariff for time-based driver service' do
      # 10 hours day duty: 8 hrs (₹800) + 2 hrs extra (2 * ₹50 = ₹100) = ₹900
      post "/api/v1/services/#{driver_service.id}/calculate_price", params: { hours: 10 }
      expect(response).to have_http_status(:ok)
      expect(json_response[:total_price]).to eq(900.0)

      # 10 hours with 2 night hours past 10 PM: 8 hrs base (₹800) + ₹300 night charge + 2 * ₹100 = ₹1300
      post "/api/v1/services/#{driver_service.id}/calculate_price", params: {
        hours: 10,
        night_hours: 2,
        extends_past_night: true
      }
      expect(response).to have_http_status(:ok)
      expect(json_response[:total_price]).to eq(1300.0)
    end
  end

  describe 'Coming Soon Service protection' do
    let!(:addr) { create(:address, user: customer) }

    it 'rejects booking requests for Coming Soon services' do
      post '/api/v1/service_requests', params: {
        service_id: ambulance_service.id,
        address_id: addr.id,
        description: 'Need ambulance urgently'
      }, headers: auth_headers(customer)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response[:error]).to include('coming soon and cannot be booked')
    end
  end
end
