class Booking < ApplicationRecord
  include AASM

  # Associations
  belongs_to :user
  belongs_to :service
  belongs_to :service_variant, optional: true
  belongs_to :address
  belongs_to :provider, optional: true
  belongs_to :assigned_by_user, class_name: 'User', foreign_key: :assigned_by, optional: true
  belongs_to :service_request, optional: true
  belongs_to :quotation, optional: true

  has_many :request_attachments, dependent: :destroy
  has_many :attachments, class_name: 'RequestAttachment', foreign_key: :booking_id, dependent: :destroy
  has_many :quotations, dependent: :destroy
  has_many :payments, dependent: :restrict_with_error
  has_many :communications, dependent: :destroy
  has_many :provider_assignments, -> { order(created_at: :desc) }, dependent: :restrict_with_error
  has_many :assigned_providers, through: :provider_assignments, source: :provider
  has_many :status_histories, -> { where(entity_type: 'Booking') },
           foreign_key: :entity_id, dependent: :destroy

  # Validations
  validates :reference_number, presence: true, uniqueness: true
  validates :description, presence: true
  validates :status, presence: true
  validates :rating, numericality: { in: 1..5 }, allow_nil: true

  # Callbacks
  before_validation :generate_reference_number, on: :create
  before_validation :set_initial_state, on: :create

  # Scopes
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :upcoming, -> { where(status: %w[confirmed rescheduled in_progress]).where("scheduled_at >= ? OR scheduled_at IS NULL", Time.current) }
  scope :past, -> { where(status: %w[completed cancelled]) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_provider, ->(provider_id) {
    where(provider_id: provider_id).or(
      where(id: ProviderAssignment.where(provider_id: provider_id, status: %w[assigned accepted in_progress completed]).select(:booking_id))
    )
  }

  # AASM Finite State Machine
  aasm column: 'status' do
    state :pending_review, initial: true
    state :contacting_provider
    state :quotation_sent
    state :quotation_approved
    state :confirmed
    state :in_progress
    state :rescheduled
    state :completed
    state :cancelled

    event :assign_provider, after: :log_status_change do
      transitions from: [:pending_review, :contacting_provider, :quotation_sent, :quotation_approved], to: :contacting_provider
    end

    event :send_quotation, after: :log_status_change do
      transitions from: [:pending_review, :contacting_provider], to: :quotation_sent
    end

    event :approve_quotation, after: :log_status_change do
      transitions from: :quotation_sent, to: :confirmed
    end

    event :reject_quotation, after: :log_status_change do
      transitions from: :quotation_sent, to: :contacting_provider
    end

    event :confirm, after: :log_status_change do
      transitions from: [:pending_review, :contacting_provider, :quotation_sent, :quotation_approved, :rescheduled], to: :confirmed
    end

    event :start_service, after: :log_status_change do
      transitions from: [:confirmed, :contacting_provider], to: :in_progress
    end

    event :reschedule, after: :log_status_change do
      transitions from: [:confirmed, :rescheduled], to: :rescheduled
    end

    event :complete, after: :log_status_change do
      transitions from: [:confirmed, :in_progress], to: :completed
    end

    event :cancel, after: :log_status_change do
      transitions from: [:pending_review, :contacting_provider, :quotation_sent, :quotation_approved, :confirmed, :rescheduled, :in_progress], to: :cancelled
    end
  end

  def can_transition_to?(new_status)
    aasm.permitted_transitions.any? { |t| t[:state].to_s == new_status.to_s }
  end

  def transition_to!(new_status, changed_by: nil, notes: nil)
    event_name = case new_status.to_s
                 when 'contacting_provider' then :assign_provider
                 when 'quotation_sent' then :send_quotation
                 when 'quotation_approved' then :approve_quotation
                 when 'confirmed' then :confirm
                 when 'in_progress' then :start_service
                 when 'rescheduled' then :reschedule
                 when 'completed' then :complete
                 when 'cancelled' then :cancel
                 end

    if event_name && aasm.events.map(&:name).include?(event_name) && send("may_#{event_name}?")
      @current_transition_user = changed_by
      @current_transition_notes = notes
      send("#{event_name}!")
    else
      transaction do
        prev = status
        update!(status: new_status)
        record_status_history(prev, new_status, changed_by: changed_by, notes: notes)
      end
    end
  end

  def current_assignment
    provider_assignments.where(status: %w[assigned accepted in_progress]).first || provider_assignments.first
  end

  def assign_to_provider!(new_provider, assigned_by:, notes: nil)
    transaction do
      if current_assignment.present? && current_assignment.status != 'rejected'
        current_assignment.reassign_to!(new_provider, by_user: assigned_by, notes: notes)
      else
        provider_assignments.create!(
          provider: new_provider,
          assigned_by: assigned_by,
          assigned_at: Time.current,
          status: 'assigned',
          internal_notes: notes
        )
        update!(
          provider: new_provider,
          assigned_by: assigned_by.id,
          assigned_at: Time.current
        )
        assign_provider! if may_assign_provider?
      end
    end
  end
  alias_method :assign_provider_details!, :assign_to_provider!

  def active_quotation
    quotations.where(status: %w[draft submitted pending approved]).order(created_at: :desc).first || quotation
  end

  def total_paid
    payments.where(status: 'paid').sum(:amount)
  end

  def payment_amount
    total_amount || active_quotation&.amount || service&.fixed_price || 0.0
  end

  def fully_paid?
    total_paid >= payment_amount
  end

  def can_cancel?
    may_cancel? || %w[pending_review contacting_provider quotation_sent quotation_approved confirmed rescheduled].include?(status)
  end

  def can_reschedule?
    may_reschedule? || %w[confirmed rescheduled].include?(status)
  end

  private

  def generate_reference_number
    return if reference_number.present?
    loop do
      self.reference_number = "BK-#{SecureRandom.random_number(100_000..999_999)}"
      break unless Booking.exists?(reference_number: reference_number)
    end
  end

  def set_initial_state
    if service&.fixed_price? && (status.blank? || status == 'pending_review')
      self.status = 'confirmed'
      self.scheduled_at ||= preferred_at || 1.day.from_now
    elsif status.blank?
      self.status = 'pending_review'
    end
  end

  def log_status_change
    record_status_history(aasm.from_state, aasm.to_state, changed_by: @current_transition_user, notes: @current_transition_notes)
  end

  def record_status_history(from_s, to_s, changed_by: nil, notes: nil)
    StatusHistory.create!(
      entity_type: 'Booking',
      entity_id: id,
      previous_status: from_s,
      new_status: to_s,
      changed_by: changed_by&.id,
      notes: notes
    )
  end
end
