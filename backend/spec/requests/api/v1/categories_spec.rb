require 'rails_helper'

RSpec.describe 'Api::V1::Categories', type: :request do
  let!(:active_cat) { create(:category, name: 'Home Cleaning', active: true) }
  let!(:inactive_cat) { create(:category, name: 'Archive Category', active: false) }
  let!(:service) { create(:service, category: active_cat, active: true) }

  describe 'GET /api/v1/categories' do
    it 'returns only active categories' do
      get '/api/v1/categories'
      expect(response).to have_http_status(:ok)
      names = json_response.map { |c| c[:name] }
      expect(names).to include('Home Cleaning')
      expect(names).not_to include('Archive Category')
    end
  end

  describe 'GET /api/v1/categories/:id' do
    it 'returns category details with active services' do
      get "/api/v1/categories/#{active_cat.id}"
      expect(response).to have_http_status(:ok)
      expect(json_response[:id]).to eq(active_cat.id)
      expect(json_response[:active_services].length).to eq(1)
    end
  end
end
