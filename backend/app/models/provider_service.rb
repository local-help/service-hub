class ProviderService < ApplicationRecord
  belongs_to :provider
  belongs_to :service

  validates :provider_id, uniqueness: { scope: :service_id, message: "already offers this service" }
end
