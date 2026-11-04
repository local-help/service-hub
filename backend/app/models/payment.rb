class Payment < ApplicationRecord
  belongs_to :booking
  belongs_to :recorder, class_name: 'User', foreign_key: :recorded_by, optional: true

  METHODS = %w[online offline].freeze
  STATUSES = %w[pending processing paid failed refunded partially_refunded].freeze

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :method, presence: true, inclusion: { in: METHODS }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :successful, -> { where(status: 'paid') }
  scope :recent, -> { order(created_at: :desc) }

  def paid?
    status == 'paid'
  end

  def can_refund?
    paid?
  end
end
