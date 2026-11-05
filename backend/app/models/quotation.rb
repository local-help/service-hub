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
  belongs_to :service_request, optional: true
  belongs_to :booking, optional: true
  belongs_to :creator, class_name: 'User', foreign_key: :created_by
  belongs_to :provider, optional: true
  belongs_to :provider_assignment, optional: true
  belongs_to :reviewed_by, class_name: 'User', optional: true
  has_one :target_booking, class_name: 'Booking', dependent: :nullify

  STATUSES = %w[draft submitted pending approved rejected expired withdrawn].freeze

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

  def can_approve?
    %w[pending submitted].include?(status) && !expired?
  end

  def can_reject?
    %w[pending submitted].include?(status)
  end

  def can_modify?
    %w[draft submitted pending].include?(status)
  end

  def reference_number
    "QT-#{id.to_s.rjust(5, '0')}"
  end

  def submit!(by_user:)
    transaction do
      update!(status: 'submitted', created_by: by_user.id)
      if booking.present? && booking.may_send_quotation?
        booking.send_quotation!
      elsif service_request.present? && service_request.can_transition_to?('quotation_sent')
        service_request.transition_to!('quotation_sent', changed_by: by_user)
      end
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: 'draft',
        new_status: 'submitted',
        changed_by: by_user.id,
        notes: 'Quotation submitted by provider'
      )
    end
  end

  def withdraw!(by_user: nil, reason: nil)
    transaction do
      update!(status: 'withdrawn')
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: status,
        new_status: 'withdrawn',
        changed_by: by_user&.id,
        notes: reason || 'Quotation withdrawn'
      )
    end
  end

  def approve!(changed_by: nil)
    raise InvalidTransitionError, "Quotation cannot be approved" unless can_approve?

    transaction do
      update!(status: 'approved', reviewed_by: changed_by, reviewed_at: Time.current)
      if booking.present?
        booking.update!(total_amount: amount, quotation_id: id)
        booking.approve_quotation! if booking.may_approve_quotation?
      end
      service_request.transition_to!('quotation_approved', changed_by: changed_by) if service_request.present? && service_request.can_transition_to?('quotation_approved')
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: 'pending',
        new_status: 'approved',
        changed_by: changed_by&.id
      )
    end
  end

  def reject!(changed_by: nil, reason: nil)
    raise InvalidTransitionError, "Quotation cannot be rejected" unless can_reject?

    transaction do
      update!(status: 'rejected', reviewed_by: changed_by, reviewed_at: Time.current)
      booking.reject_quotation! if booking.present? && booking.may_reject_quotation?
      if service_request.present? && service_request.can_transition_to?('quotation_rejected')
        service_request.transition_to!('quotation_rejected', changed_by: changed_by, notes: reason)
      end
      StatusHistory.create!(
        entity_type: 'Quotation',
        entity_id: id,
        previous_status: 'pending',
        new_status: 'rejected',
        changed_by: changed_by&.id,
        notes: reason
      )
    end
  end

  private

  def valid_until_must_be_future
    return unless valid_until.present? && valid_until <= Time.current

    errors.add(:valid_until, "must be in the future")
  end

  def only_one_active_quotation_per_request
    if booking && booking.quotations.where(status: %w[draft submitted pending approved]).where.not(id: id).exists?
      errors.add(:booking_id, "already has an active quotation")
    elsif service_request && service_request.quotations.where(status: %w[draft submitted pending approved]).where.not(id: id).exists?
      errors.add(:service_request_id, "already has an active quotation")
    end
  end
end
