require 'rails_helper'

RSpec.describe 'Api::V1::Health', type: :request do
  describe 'GET /api/v1/health' do
    it 'returns ok status and database connected' do
      get '/api/v1/health'
      expect(response).to have_http_status(:ok)
      expect(json_response[:status]).to eq('ok')
      expect(json_response[:database]).to eq(true)
    end
  end
end
