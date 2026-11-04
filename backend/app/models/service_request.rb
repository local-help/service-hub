class ServiceRequest < ApplicationRecord
  belongs_to :user
  belongs_to :service
  belongs_to :address
  belongs_to :provider, optional: true
  belongs_to :assigned_by_user, class_name: 'User', foreign_key: :assigned_by, optional: true

  has_many :request_attachments, dependent: :destroy
  has_one :quotation, dependent: :destroy
  has_one :booking, dependent: :destroy
  has_many :communications, dependent: :destroy
  has_many :status_histories, -> { where(entity_type: 'ServiceRequest') },
           foreign_key: :entity_id, dependent: :destroy

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
    'contacting_provider' => %w[quotation_sent cancelled],
    'quotation_sent' => %w[quotation_approved quotation_rejected cancelled],
    'quotation_approved' => %w[booking_confirmed cancelled],
    'quotation_rejected' => %w[contacting_provider cancelled],
    'booking_confirmed' => %w[in_progress completed cancelled],
    'in_progress' => %w[completed cancelled],
    'completed' => [],
    'cancelled' => []
  }.freeze

  validates :reference_number, presence: true, uniqueness: true
  validates :description, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_service, ->(service_id) { where(service_id: service_id) if service_id.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :pending, -> { where(status: %w[pending_review contacting_provider quotation_sent]) }
  scope :active, -> { where.not(status: %w[completed cancelled]) }

  before_validation :generate_reference_number, on: :create

  def can_transition_to?(new_status)
    VALID_TRANSITIONS.fetch(status, []).include?(new_status)
  end

  def transition_to!(new_status, changed_by: nil, notes: nil)
    unless can_transition_to?(new_status)
      raise InvalidTransitionError, "Cannot transition from #{status} to #{new_status}"
    end

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
