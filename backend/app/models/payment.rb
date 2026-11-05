# == Schema Information
#
# Table name: payments
#
#  id                :bigint           not null, primary key
#  amount            :decimal(10, 2)   not null
#  gateway_metadata  :jsonb
#  gateway_reference :string
#  method            :string           not null
#  recorded_by       :bigint
#  status            :string           default("pending"), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  booking_id        :bigint           not null
#  gateway_order_id  :string
#
# Indexes
#
#  index_payments_on_booking_id         (booking_id)
#  index_payments_on_gateway_order_id   (gateway_order_id) UNIQUE WHERE (gateway_order_id IS NOT NULL)
#  index_payments_on_gateway_reference  (gateway_reference) UNIQUE WHERE (gateway_reference IS NOT NULL)
#  index_payments_on_status             (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (recorded_by => users.id)
#
class Payment < ApplicationRecord
  include AASM

  belongs_to :booking
  belongs_to :recorder, class_name: 'User', foreign_key: :recorded_by, optional: true

  METHODS = %w[online offline].freeze
  STATUSES = %w[pending processing paid failed refunded partially_refunded].freeze

  aasm column: 'status' do
    state :pending, initial: true
    state :processing
    state :paid
    state :failed
    state :refunded
    state :partially_refunded

    event :process do
      transitions from: :pending, to: :processing
    end

    event :mark_paid do
      transitions from: %i[pending processing], to: :paid
    end

    event :mark_failed do
      transitions from: %i[pending processing], to: :failed
    end

    event :refund do
      transitions from: %i[paid partially_refunded], to: :refunded
    end

    event :partially_refund do
      transitions from: :paid, to: :partially_refunded
    end
  end

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :method, presence: true, inclusion: { in: METHODS }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :successful, -> { where(status: 'paid') }
  scope :recent, -> { order(created_at: :desc) }

  def can_refund?
    may_refund?
  end

  def can_transition_to?(new_status)
    aasm.permitted_transitions.any? { |t| t[:state].to_s == new_status.to_s }
  end
end
