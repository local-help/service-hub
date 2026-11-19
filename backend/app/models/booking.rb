# == Schema Information
#
# Table name: bookings
#
#  id                  :bigint           not null, primary key
#  admin_notes         :text
#  assigned_at         :datetime
#  assigned_by         :bigint
#  booking_type        :string
#  cancellation_reason :text
#  description         :text
#  duration_hours      :integer
#  feedback            :text
#  preferred_at        :datetime
#  rating              :integer
#  reference_number    :string
#  scheduled_at        :datetime
#  selected_options    :jsonb
#  status              :string           default("confirmed"), not null
#  total_amount        :decimal(10, 2)
#  vehicle_type        :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  address_id          :bigint
#  provider_id         :bigint
#  quotation_id        :bigint
#  service_id          :bigint
#  service_request_id  :bigint
#  service_variant_id  :bigint
#  user_id             :bigint
#
# Indexes
#
#  index_bookings_on_address_id          (address_id)
#  index_bookings_on_provider_id         (provider_id)
#  index_bookings_on_quotation_id        (quotation_id)
#  index_bookings_on_reference_number    (reference_number) UNIQUE
#  index_bookings_on_scheduled_at        (scheduled_at)
#  index_bookings_on_service_id          (service_id)
#  index_bookings_on_service_request_id  (service_request_id) UNIQUE
#  index_bookings_on_service_variant_id  (service_variant_id)
#  index_bookings_on_status              (status)
#  index_bookings_on_user_id             (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (address_id => addresses.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (quotation_id => quotations.id)
#  fk_rails_...  (service_id => services.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#  fk_rails_...  (service_variant_id => service_variants.id)
#  fk_rails_...  (user_id => users.id)
#
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
  has_many :attachments, class_name: 'RequestAttachment', dependent: :destroy
  has_many :quotations, dependent: :destroy
  has_many :payments, dependent: :restrict_with_error
  has_many :payment_receipts, dependent: :restrict_with_error
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
  scope :upcoming, -> { where(status: %w[pending_assignment specialist_assigned confirmed rescheduled in_progress]).where("scheduled_at >= ? OR scheduled_at IS NULL", Time.current) }
  scope :pending, -> { where(status: %w[pending_assignment pending_review]) }
  scope :assigned, -> { where(status: %w[specialist_assigned contacting_provider]) }
  scope :in_progress, -> { where(status: 'in_progress') }
  scope :past, -> { where(status: %w[completed cancelled]) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_provider, lambda { |provider_id|
    where(provider_id: provider_id).or(
      where(id: ProviderAssignment.where(provider_id: provider_id, status: %w[assigned accepted in_progress completed]).select(:booking_id))
    )
  }

  # AASM Finite State Machine
  aasm column: 'status' do
    state :pending_assignment, initial: true
    state :specialist_assigned
    state :confirmed
    state :in_progress
    state :rescheduled
    state :completed
    state :cancelled
    # Backward compatibility with legacy request/inquiry states:
    state :pending_review
    state :contacting_provider
    state :quotation_sent
    state :quotation_approved
    state :quotation_rejected

    event :assign_specialist, after: :log_status_change do
      transitions from: %i[pending_assignment pending_review contacting_provider quotation_sent quotation_approved confirmed specialist_assigned rescheduled], to: :specialist_assigned
    end

    event :unassign_specialist, after: :log_status_change do
      transitions from: %i[specialist_assigned contacting_provider], to: :pending_assignment
    end

    event :confirm, after: :log_status_change do
      transitions from: %i[pending_assignment pending_review contacting_provider quotation_sent quotation_approved specialist_assigned rescheduled], to: :confirmed
    end

    event :start_service, after: :log_status_change do
      transitions from: %i[pending_assignment specialist_assigned confirmed contacting_provider rescheduled], to: :in_progress
    end

    event :reschedule, after: :log_status_change do
      transitions from: %i[pending_assignment specialist_assigned confirmed rescheduled in_progress], to: :rescheduled
    end

    event :complete, after: :log_status_change do
      transitions from: %i[specialist_assigned confirmed in_progress], to: :completed
    end

    event :cancel, after: :log_status_change do
      transitions from: %i[pending_assignment pending_review contacting_provider quotation_sent quotation_approved quotation_rejected confirmed specialist_assigned rescheduled in_progress], to: :cancelled
    end

    event :send_quotation, after: :log_status_change do
      transitions from: %i[pending_assignment pending_review contacting_provider], to: :quotation_sent
    end

    event :approve_quotation, after: :log_status_change do
      transitions from: %i[quotation_sent quotation_approved], to: :confirmed
    end

    event :reject_quotation, after: :log_status_change do
      transitions from: %i[quotation_sent], to: :pending_assignment
    end
  end

  # State event backward compatibility
  alias_attribute :order_number, :reference_number

  def assign_provider(*args)
    assign_specialist(*args)
  end

  def assign_provider!(*args)
    assign_specialist!(*args)
  end

  def may_assign_provider?(*args)
    may_assign_specialist?(*args)
  end

  def can_transition_to?(new_status)
    aasm.permitted_transitions.any? { |t| t[:state].to_s == new_status.to_s }
  end

  def transition_to!(new_status, changed_by: nil, notes: nil)
    target = aasm.permitted_transitions.find { |t| t[:state].to_s == new_status.to_s }
    raise InvalidTransitionError, "Cannot transition booking from #{status} to #{new_status}" unless target

    @current_transition_user = changed_by
    @current_transition_notes = notes
    send(:"#{target[:event]}!")
  rescue AASM::InvalidTransition => e
    raise InvalidTransitionError, e.message
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
      end

      update!(
        provider: new_provider,
        assigned_by: assigned_by&.id,
        assigned_at: Time.current
      )

      assign_specialist!(changed_by: assigned_by, notes: notes) if may_assign_specialist?
    end
  end
  alias assign_provider_details! assign_to_provider!

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
    may_cancel?
  end

  def can_reschedule?
    may_reschedule?
  end

  private

  def generate_reference_number
    return if reference_number.present?

    loop do
      self.reference_number = "ORD-#{SecureRandom.random_number(100_000..999_999)}"
      break unless Booking.exists?(reference_number: reference_number)
    end
  end

  def set_initial_state
    self.status = 'pending_assignment' if status.blank?
    self.scheduled_at ||= preferred_at || 1.day.from_now
  end

  def log_status_change(*args)
    opts = args.extract_options!
    user = opts[:changed_by] || @current_transition_user
    notes = opts[:notes] || @current_transition_notes
    record_status_history(aasm.from_state.to_s, aasm.to_state.to_s, changed_by: user, notes: notes)
  ensure
    @current_transition_user = nil
    @current_transition_notes = nil
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
