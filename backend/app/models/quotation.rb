# == Schema Information
#
# Table name: quotations
#
#  id                        :bigint           not null, primary key
#  amount                    :decimal(10, 2)   not null
#  created_by                :bigint           not null
#  description               :text
#  estimated_completion_time :string
#  reviewed_at               :datetime
#  status                    :string           default("pending"), not null
#  valid_until               :datetime         not null
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  booking_id                :bigint
#  provider_assignment_id    :bigint
#  provider_id               :bigint
#  reviewed_by_id            :bigint
#  service_request_id        :bigint
#
# Indexes
#
#  index_quotations_on_active_per_request      (service_request_id) UNIQUE WHERE ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'pending'::character varying, 'approved'::character varying])::text[]))
#  index_quotations_on_booking_id              (booking_id)
#  index_quotations_on_provider_assignment_id  (provider_assignment_id)
#  index_quotations_on_provider_id             (provider_id)
#  index_quotations_on_status                  (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (provider_assignment_id => provider_assignments.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (reviewed_by_id => users.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
class Quotation < ApplicationRecord
  include AASM

  belongs_to :service_request, optional: true
  belongs_to :booking, optional: true
  belongs_to :creator, class_name: 'User', foreign_key: :created_by
  belongs_to :provider, optional: true
  belongs_to :provider_assignment, optional: true
  belongs_to :reviewed_by, class_name: 'User', optional: true
  has_one :target_booking, class_name: 'Booking', dependent: :nullify

  STATUSES = %w[draft submitted pending approved rejected expired withdrawn].freeze

  aasm column: 'status' do
    state :pending, initial: true
    state :draft
    state :submitted
    state :approved
    state :rejected
    state :expired
    state :withdrawn

    event :submit, before: :on_submit, after: :log_status_change do
      transitions from: %i[draft pending submitted], to: :submitted
    end

    event :approve, before: :on_approve, after: :log_status_change do
      transitions from: %i[submitted pending], to: :approved, guard: :not_expired?
    end

    event :reject, before: :on_reject, after: :log_status_change do
      transitions from: %i[submitted pending], to: :rejected
    end

    event :expire, after: :log_status_change do
      transitions from: %i[draft submitted pending], to: :expired
    end

    event :withdraw, before: :on_withdraw, after: :log_status_change do
      transitions from: %i[draft submitted pending], to: :withdrawn
    end
  end

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :valid_until, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :valid_until_must_be_future, on: :create
  validate :only_one_active_quotation_per_request, on: :create

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :active_quotes, -> { where(status: %w[draft submitted pending approved]) }
  scope :pending_or_approved, -> { where(status: %w[pending approved submitted]) }

  def expired?
    valid_until < Time.current && %w[draft submitted pending].include?(status)
  end

  def not_expired?
    !expired?
  end

  def can_approve?
    may_approve?
  end

  def can_reject?
    may_reject?
  end

  def can_modify?
    draft? || submitted? || pending?
  end

  def can_transition_to?(new_status)
    aasm.permitted_transitions.any? { |t| t[:state].to_s == new_status.to_s }
  end

  def reference_number
    "QT-#{id.to_s.rjust(5, '0')}"
  end

  private

  def on_submit(*args)
    opts = args.extract_options!
    by_user = opts[:by_user]
    self.created_by = by_user.is_a?(User) ? by_user.id : by_user

    if booking.present? && booking.may_send_quotation?
      booking.send_quotation!
    elsif service_request.present? && service_request.can_transition_to?('quotation_sent')
      service_request.transition_to!('quotation_sent', changed_by: by_user)
    end
  end

  def on_approve(*args)
    opts = args.extract_options!
    user = opts[:changed_by]
    self.reviewed_by = user
    self.reviewed_at = Time.current

    if booking.present?
      booking.update!(total_amount: amount, quotation_id: id)
      booking.approve_quotation! if booking.may_approve_quotation?
    end
    return unless service_request.present? && service_request.can_transition_to?('quotation_approved')

    service_request.transition_to!('quotation_approved', changed_by: user)
  end

  def on_reject(*args)
    opts = args.extract_options!
    user = opts[:changed_by]
    reason = opts[:reason]
    self.reviewed_by = user
    self.reviewed_at = Time.current

    booking.reject_quotation! if booking.present? && booking.may_reject_quotation?
    return unless service_request.present? && service_request.can_transition_to?('quotation_rejected')

    service_request.transition_to!('quotation_rejected', changed_by: user, notes: reason)
  end

  def on_withdraw(*args)
    # no extra side effects
  end

  def log_status_change(*args)
    opts = args.extract_options!
    user = opts[:changed_by] || opts[:by_user]
    user_id = user.is_a?(User) ? user.id : user
    notes = opts[:reason] || opts[:notes]

    StatusHistory.create!(
      entity_type: 'Quotation',
      entity_id: id,
      previous_status: aasm.from_state.to_s,
      new_status: aasm.to_state.to_s,
      changed_by: user_id,
      notes: notes
    )
  end

  def valid_until_must_be_future
    return unless valid_until.present? && valid_until <= Time.current

    errors.add(:valid_until, 'must be in the future')
  end

  def only_one_active_quotation_per_request
    if booking && booking.quotations.where(status: %w[draft submitted pending approved]).where.not(id: id).exists?
      errors.add(:booking_id, 'already has an active quotation')
    elsif service_request && service_request.quotations.where(status: %w[draft submitted pending approved]).where.not(id: id).exists?
      errors.add(:service_request_id, 'already has an active quotation')
    end
  end
end
