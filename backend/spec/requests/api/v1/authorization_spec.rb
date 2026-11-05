require 'rails_helper'

RSpec.describe 'Authorization & Role Access Control', type: :request do
  let(:customer) { create(:user, role: 'customer') }
  let(:other_customer) { create(:user, role: 'customer') }
  let(:admin) { create(:user, :admin) }
  let(:super_admin) { create(:user, :super_admin) }

  describe 'User roles and switches' do
    it 'allows admin to access customer features' do
      get '/api/v1/categories', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
    end

    it 'allows super admin to access customer features' do
      get '/api/v1/categories', headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'Pundit user policy enforcement' do
    it 'prevents regular customer from listing admin users' do
      policy = UserPolicy.new(customer, User)
      expect(policy.index?).to eq(false)
      expect(policy.create?).to eq(false)
      expect(policy.invite?).to eq(false)
    end

    it 'allows super admin to invite and manage admin users' do
      policy = UserPolicy.new(super_admin, User)
      expect(policy.index?).to eq(true)
      expect(policy.create?).to eq(true)
      expect(policy.invite?).to eq(true)
    end

    it 'restricts provider directory management to admins' do
      customer_policy = ProviderPolicy.new(customer, Provider)
      admin_policy = ProviderPolicy.new(admin, Provider)

      expect(customer_policy.index?).to eq(false)
      expect(customer_policy.create?).to eq(false)

      expect(admin_policy.index?).to eq(true)
      expect(admin_policy.create?).to eq(true)
    end
  end
end
