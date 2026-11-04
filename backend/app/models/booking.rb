class Booking < ApplicationRecord
  belongs_to :service_request
  belongs_to :quotation, optional: true

  has_many :payments, dependent: :restrict_with_error
  has_many :status_histories, -> { where(entity_type: 'Booking') },
           foreign_key: :entity_id, dependent: :destroy

  STATUSES = %w[confirmed in_progress completed cancelled rescheduled].freeze

  VALID_TRANSITIONS = {
    'confirmed' => %w[in_progress completed cancelled rescheduled],
    'rescheduled' => %w[confirmed in_progress completed cancelled],
    'in_progress' => %w[completed cancelled],
    'completed' => [],
    'cancelled' => []
  }.freeze

  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :service_request_id, uniqueness: { message: "already has a booking" }
  validates :rating, numericality: { in: 1..5 }, allow_nil: true

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :upcoming, -> { where(status: %w[confirmed rescheduled]).where("scheduled_at >= ?", Time.current) }
  scope :past, -> { where(status: %w[completed cancelled]) }
  scope :recent, -> { order(created_at: :desc) }

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
        entity_type: 'Booking',
        entity_id: id,
        previous_status: previous,
        new_status: new_status,
        changed_by: changed_by&.id,
        notes: notes
      )
    end
  end

  def total_paid
    payments.where(status: 'paid').sum(:amount)
  end

  def payment_amount
    quotation&.amount || service_request.service.fixed_price
  end

  def fully_paid?
    total_paid >= (payment_amount || 0)
  end

  def can_cancel?
    can_transition_to?('cancelled')
  end

  def can_reschedule?
    can_transition_to?('rescheduled') || can_transition_to?('confirmed')
  end
end
