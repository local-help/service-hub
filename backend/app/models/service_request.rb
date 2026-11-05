# == Schema Information
#
# Table name: service_requests
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text             not null
#  duration_hours      :integer
#  preferred_at        :datetime
#  reference_number    :string           not null
#  selected_options    :jsonb
#  status              :string           default("pending_review"), not null
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint           not null
#  provider_id         :bigint
#  service_id          :bigint           not null
#  service_variant_id  :bigint
#  user_id             :bigint           not null
#
# Indexes
#
#  index_service_requests_on_address_id          (address_id)
#  index_service_requests_on_preferred_at        (preferred_at)
#  index_service_requests_on_provider_id         (provider_id)
#  index_service_requests_on_reference_number    (reference_number) UNIQUE
#  index_service_requests_on_service_id          (service_id)
#  index_service_requests_on_service_variant_id  (service_variant_id)
#  index_service_requests_on_status              (status)
#  index_service_requests_on_user_id             (user_id)
#  index_service_requests_on_user_id_and_status  (user_id,status)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (assigned_by => users.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
class ServiceRequest < ApplicationRecord
  belongs_to :user
  belongs_to :service
  belongs_to :service_variant, optional: true
  belongs_to :address
  belongs_to :provider, optional: true
  belongs_to :assigned_by_user, class_name: 'User', foreign_key: :assigned_by, optional: true

  has_many :request_attachments, dependent: :destroy
  has_many :quotations, dependent: :destroy
  has_one :booking, dependent: :destroy
  has_many :communications, dependent: :destroy
  has_many :status_histories, -> { where(entity_type: 'ServiceRequest') },
           foreign_key: :entity_id, dependent: :destroy
  has_many :provider_assignments, -> { order(created_at: :desc) }, dependent: :restrict_with_error
  has_many :assigned_providers, through: :provider_assignments, source: :provider

  STATUSES = %w[
    pending_review
    contacting_provider
    quotation_sent
    quotation_approved
    quotation_rejected
    booking_confirmed
    in_progress
    completed
    cancelled
  ].freeze

  VALID_TRANSITIONS = {
    'pending_review' => %w[contacting_provider quotation_sent booking_confirmed cancelled],
    'contacting_provider' => %w[quotation_sent booking_confirmed in_progress cancelled],
    'quotation_sent' => %w[quotation_approved quotation_rejected cancelled],
    'quotation_approved' => %w[booking_confirmed in_progress completed cancelled],
    'quotation_rejected' => %w[contacting_provider cancelled],
    'booking_confirmed' => %w[in_progress completed cancelled],
    'in_progress' => %w[completed cancelled],
    'completed' => [],
    'cancelled' => []
  }.freeze

  validates :reference_number, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  before_validation :generate_reference_number, on: :create

  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :assigned_to_provider, lambda { |provider_id|
    where(id: ProviderAssignment.where(provider_id: provider_id, status: %w[assigned accepted in_progress completed]).select(:service_request_id))
  }

  def quotation
    active_quotation || quotations.order(created_at: :desc).first
  end

  def build_quotation(attrs = {})
    quotations.build(attrs)
  end

  def active_quotation
    quotations.where(status: %w[draft submitted pending approved]).first
  end

  def current_assignment
    provider_assignments.where(status: %w[assigned accepted in_progress]).first
  end

  def active_provider
    current_assignment&.provider || provider
  end

  def assign_provider!(provider, assigned_by:, notes: nil)
    transaction do
      # If current active assignment exists, close it as reassigned
      current_assignment&.reassign_to!(provider, by_user: assigned_by, notes: notes) || begin
        provider_assignments.create!(
          provider: provider,
          assigned_by: assigned_by,
          assigned_at: Time.current,
          status: 'assigned',
          internal_notes: notes
        )
        update!(
          provider: provider,
          assigned_by: assigned_by.id,
          assigned_at: Time.current,
          status: status == 'pending_review' ? 'contacting_provider' : status
        )
      end
    end
  end

  def can_transition_to?(new_status)
    VALID_TRANSITIONS[status]&.include?(new_status)
  end

  def transition_to!(new_status, changed_by: nil, notes: nil)
    raise InvalidTransitionError, "Cannot transition from #{status} to #{new_status}" unless can_transition_to?(new_status)

    transaction do
      previous = status
      update!(status: new_status)
      StatusHistory.create!(
        entity_type: 'ServiceRequest',
        entity_id: id,
        previous_status: previous,
        new_status: new_status,
        changed_by: changed_by&.id,
        notes: notes
      )
    end
  end

  def fixed_price_service?
    service.fixed_price?
  end

  private

  def generate_reference_number
    return if reference_number.present?

    loop do
      self.reference_number = "LH-#{SecureRandom.random_number(10_000..99_999)}"
      break unless ServiceRequest.exists?(reference_number: reference_number)
    end
  end
end

class InvalidTransitionError < StandardError; end
