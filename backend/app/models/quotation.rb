class Quotation < ApplicationRecord
  belongs_to :service_request
  belongs_to :creator, class_name: 'User', foreign_key: :created_by
  has_one :booking, dependent: :nullify

  STATUSES = %w[pending approved rejected expired].freeze

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :valid_until, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :service_request_id, uniqueness: { message: "already has a quotation" }
  validate :valid_until_must_be_future, on: :create

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :pending, -> { where(status: 'pending') }

  def expired?
    valid_until < Time.current && status == 'pending'
  end

  def can_approve?
    status == 'pending' && !expired?
  end

  def can_reject?
    status == 'pending'
  end

  def can_modify?
    status == 'pending'
  end

  def approve!(changed_by: nil)
    raise InvalidTransitionError, "Quotation cannot be approved" unless can_approve?

    transaction do
      update!(status: 'approved')
      service_request.transition_to!('quotation_approved', changed_by: changed_by)
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: 'pending',
        new_status: 'approved',
        changed_by: changed_by&.id
      )
    end
  end

  def reject!(changed_by: nil)
    raise InvalidTransitionError, "Quotation cannot be rejected" unless can_reject?

    transaction do
      update!(status: 'rejected')
      service_request.transition_to!('quotation_rejected', changed_by: changed_by)
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: 'pending',
        new_status: 'rejected',
        changed_by: changed_by&.id
      )
    end
  end

  private

  def valid_until_must_be_future
    if valid_until.present? && valid_until <= Time.current
      errors.add(:valid_until, "must be in the future")
    end
  end
end
