class Address < ApplicationRecord
  belongs_to :user

  has_many :bookings, dependent: :restrict_with_error
  has_many :service_requests, dependent: :restrict_with_error

  validates :address_line, presence: true
  validates :city, presence: true
  validates :state, presence: true
  validates :postal_code, presence: true, format: { with: /\A\d{5,10}\z/ }
  validates :latitude, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }, allow_nil: true
  validates :longitude, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }, allow_nil: true

  scope :default_first, -> { order(is_default: :desc, created_at: :desc) }

  before_save :ensure_single_default

  def full_address
    [address_line, landmark, city, state, postal_code].compact_blank.join(", ")
  end

  private

  def ensure_single_default
    if is_default? && is_default_changed?
      user.addresses.where.not(id: id).update_all(is_default: false)
    end
  end
end
