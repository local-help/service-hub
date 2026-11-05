class User < ApplicationRecord
  has_secure_password validations: false

  # Associations
  has_many :addresses, dependent: :destroy
  has_many :bookings, dependent: :restrict_with_error
  has_many :service_requests, dependent: :restrict_with_error
  has_many :refresh_tokens, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :device_tokens, dependent: :destroy
  has_many :provider_users, dependent: :destroy
  has_many :providers, through: :provider_users

  # Enums
  enum :role, { customer: 'customer', admin: 'admin', super_admin: 'super_admin', provider: 'provider' }
  enum :status, { active: 'active', inactive: 'inactive', suspended: 'suspended' }, prefix: true

  # Validations
  validates :name, presence: true, length: { maximum: 100 }
  validates :email, uniqueness: { case_sensitive: false, allow_nil: true },
                    format: { with: URI::MailTo::EMAIL_REGEXP, allow_nil: true }
  validates :phone, uniqueness: { allow_nil: true },
                    format: { with: /\A\+?[1-9]\d{6,14}\z/, allow_nil: true }
  validates :role, presence: true
  validates :status, presence: true
  validates :password, length: { minimum: 8 }, if: -> { password_digest_changed? && password_digest.present? }
  validate :must_have_email_or_phone

  # Scopes
  scope :customers, -> { where(role: :customer) }
  scope :admins, -> { where(role: [:admin, :super_admin]) }
  scope :providers, -> { where(role: :provider) }

  # Callbacks
  before_validation :normalize_attributes

  def admin_or_super_admin?
    admin? || super_admin?
  end

  def active_provider_user
    provider_users.where(active: true).first
  end

  def service_provider
    active_provider_user&.provider
  end
  alias_method :provider_organization, :service_provider

  def provider_role
    active_provider_user&.role
  end

  def provider_owner?
    provider? && active_provider_user&.role_owner?
  end

  def provider_manager?
    provider? && (active_provider_user&.role_owner? || active_provider_user&.role_manager?)
  end

  def display_name
    name.presence || phone || email
  end

  private

  def normalize_attributes
    self.email = email.presence&.downcase&.strip
    if phone.present?
      self.phone = phone.to_s.gsub(/[\s\-\(\)]/, '').presence
    else
      self.phone = nil
    end
  end

  def must_have_email_or_phone
    if email.blank? && phone.blank?
      errors.add(:base, 'Must provide either email or phone number')
    end
  end
end
