class Provider < ApplicationRecord
  self.table_name = 'providers'

  alias_attribute :business_name, :name

  # Associations
  has_many :provider_users, dependent: :destroy
  has_many :users, through: :provider_users
  has_many :provider_services, dependent: :destroy
  has_many :services, through: :provider_services
  has_many :provider_assignments, dependent: :restrict_with_error
  has_many :service_requests, through: :provider_assignments
  has_many :quotations, dependent: :nullify
  has_one :availability, class_name: 'ProviderAvailability', dependent: :destroy
  belongs_to :approved_by, class_name: 'User', optional: true

  # Statuses
  VERIFICATION_STATUSES = %w[pending under_review verified rejected suspended].freeze
  OPERATIONAL_STATUSES = %w[active inactive suspended].freeze
  ONBOARDING_STATUSES = %w[pending under_review completed].freeze

  before_validation :generate_slug
  before_validation :set_defaults, on: :create

  validates :name, presence: true
  validates :phone, presence: true
  validates :slug, presence: true, uniqueness: { case_sensitive: false }
  validates :verification_status, inclusion: { in: VERIFICATION_STATUSES }
  validates :operational_status, inclusion: { in: OPERATIONAL_STATUSES }
  validates :onboarding_status, inclusion: { in: ONBOARDING_STATUSES }

  # Scopes
  scope :active, -> { where(operational_status: 'active', active: true) }
  scope :verified, -> { where(verification_status: 'verified') }
  scope :eligible_for_assignment, -> { verified.active }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :for_service, ->(service_id) {
    joins(:provider_services).where(provider_services: { service_id: service_id, active: true })
  }
  scope :search, ->(query) {
    where("providers.name ILIKE :q OR providers.phone ILIKE :q OR providers.email ILIKE :q OR providers.contact_person ILIKE :q", q: "%#{query}%") if query.present?
  }

  def verified?
    verification_status == 'verified'
  end

  def suspended?
    verification_status == 'suspended' || operational_status == 'suspended'
  end

  def operational_active?
    operational_status == 'active' && active?
  end

  def eligible_for_assignment?
    verified? && operational_active? && !suspended?
  end

  def active_assignments
    provider_assignments.where(status: %w[assigned accepted in_progress])
  end

  def completed_assignments_count
    provider_assignments.where(status: 'completed').count
  end

  def active_assignments_count
    active_assignments.count
  end

  def verify!(by_user:)
    update!(
      verification_status: 'verified',
      operational_status: 'active',
      active: true,
      approved_at: Time.current,
      approved_by: by_user,
      suspended_at: nil,
      suspension_reason: nil
    )
  end

  def reject_verification!(reason:, by_user:)
    update!(
      verification_status: 'rejected',
      operational_status: 'inactive',
      active: false,
      suspension_reason: reason
    )
  end

  def suspend!(reason:, by_user:)
    update!(
      verification_status: 'suspended',
      operational_status: 'suspended',
      active: false,
      suspended_at: Time.current,
      suspension_reason: reason
    )
  end

  def activate!
    update!(
      operational_status: 'active',
      active: true,
      suspended_at: nil,
      suspension_reason: nil
    )
  end

  def deactivate!
    update!(
      operational_status: 'inactive',
      active: false
    )
  end

  private

  def generate_slug
    return if slug.present?
    base = name.to_s.parameterize
    base = "provider" if base.blank?
    candidate = base
    counter = 1
    while Provider.where.not(id: id).exists?(slug: candidate)
      candidate = "#{base}-#{counter}"
      counter += 1
    end
    self.slug = candidate
  end

  def set_defaults
    self.verification_status ||= 'verified'
    self.operational_status ||= 'active'
    self.onboarding_status ||= 'completed'
    self.active = true if active.nil?
  end
end

# Backward and domain-compatible alias
ServiceProvider = Provider
