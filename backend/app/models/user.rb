class User < ApplicationRecord
  has_secure_password validations: false

  # Associations
  has_many :addresses, dependent: :destroy
  has_many :service_requests, dependent: :restrict_with_error
  has_many :refresh_tokens, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :device_tokens, dependent: :destroy

  # Enums
  enum :role, { customer: 'customer', admin: 'admin', super_admin: 'super_admin' }
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

  # Callbacks
  before_save :normalize_email

  def admin_or_super_admin?
    admin? || super_admin?
  end

  def display_name
    name.presence || phone || email
  end

  private

  def normalize_email
    self.email = email&.downcase&.strip
  end

  def must_have_email_or_phone
    if email.blank? && phone.blank?
      errors.add(:base, "Either email or phone must be provided")
    end
  end
end
