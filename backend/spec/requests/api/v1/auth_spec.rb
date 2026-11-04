require 'rails_helper'

RSpec.describe 'Api::V1::Auth', type: :request do
  describe 'POST /api/v1/auth/register' do
    let(:valid_params) do
      {
        name: 'Arjun Das',
        email: 'arjun@example.com',
        phone: '+919876501234',
        password: 'Password@123'
      }
    end

    it 'registers a new customer and returns JWT tokens' do
      post '/api/v1/auth/register', params: valid_params
      expect(response).to have_http_status(:created)
      expect(json_response[:user][:name]).to eq('Arjun Das')
      expect(json_response[:user][:role]).to eq('customer')
      expect(json_response[:access_token]).to be_present
      expect(json_response[:refresh_token]).to be_present
    end

    it 'rejects registration with duplicate email' do
      create(:user, email: 'arjun@example.com')
      post '/api/v1/auth/register', params: valid_params
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response[:error]).to include('Email has already been taken')
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:user) { create(:user, email: 'loginuser@example.com', password: 'Password@123') }

    it 'authenticates valid credentials' do
      post '/api/v1/auth/login', params: { email: 'loginuser@example.com', password: 'Password@123' }
      expect(response).to have_http_status(:ok)
      expect(json_response[:access_token]).to be_present
      expect(json_response[:refresh_token]).to be_present
      expect(json_response[:user][:id]).to eq(user.id)
    end

    it 'rejects invalid credentials' do
      post '/api/v1/auth/login', params: { email: 'loginuser@example.com', password: 'WrongPassword' }
      expect(response).to have_http_status(:unauthorized)
      expect(json_response[:error]).to eq('Invalid email or password')
    end
  end

  describe 'POST /api/v1/auth/otp/send and verify' do
    let(:phone) { '+919876543210' }

    it 'sends OTP and verifies successfully to issue JWT' do
      post '/api/v1/auth/otp/send', params: { phone: phone }
      expect(response).to have_http_status(:ok)
      expect(json_response[:message]).to eq('OTP sent successfully')

      # Retrieve created record
      otp_record = OtpVerification.where(phone: phone).last
      expect(otp_record).to be_present

      # Simulate verification by hashing known test OTP
      test_otp = '123456'
      otp_record.update!(otp_digest: Digest::SHA256.hexdigest(test_otp))

      post '/api/v1/auth/otp/verify', params: { phone: phone, otp: test_otp }
      expect(response).to have_http_status(:ok)
      expect(json_response[:access_token]).to be_present
      expect(json_response[:user][:phone]).to eq(phone)
      expect(json_response[:user][:phone_verified]).to eq(true)
    end

    it 'rejects incorrect OTP' do
      post '/api/v1/auth/otp/send', params: { phone: phone }
      post '/api/v1/auth/otp/verify', params: { phone: phone, otp: '000000' }
      expect(response).to have_http_status(:unauthorized)
      expect(json_response[:error]).to include('Invalid OTP')
    end
  end

  describe 'POST /api/v1/auth/refresh' do
    let(:user) { create(:user) }
    let(:raw_refresh_token) { JsonWebToken.generate_refresh_token(user) }

    it 'exchanges valid refresh token for new access and refresh tokens' do
      post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }
      expect(response).to have_http_status(:ok)
      expect(json_response[:access_token]).to be_present
      expect(json_response[:refresh_token]).to be_present
      expect(json_response[:refresh_token]).not_to eq(raw_refresh_token)
    end
  end

  describe 'GET /api/v1/auth/me' do
    let(:user) { create(:user) }

    it 'returns current user profile when authenticated' do
      get '/api/v1/auth/me', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response[:user][:id]).to eq(user.id)
    end

    it 'returns unauthorized when token is missing' do
      get '/api/v1/auth/me'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

