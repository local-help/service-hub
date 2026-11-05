# == Schema Information
#
# Table name: provider_assignments
#
#  id                 :bigint           not null, primary key
#  accepted_at        :datetime
#  assigned_at        :datetime         not null
#  completed_at       :datetime
#  internal_notes     :text
#  rejected_at        :datetime
#  rejection_reason   :text
#  status             :string           default("assigned"), not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  assigned_by_id     :bigint           not null
#  booking_id         :bigint
#  provider_id        :bigint           not null
#  service_request_id :bigint
#
# Indexes
#
#  index_provider_assignments_on_booking_id          (booking_id)
#  index_provider_assignments_on_provider_id         (provider_id)
#  index_provider_assignments_on_service_request_id  (service_request_id)
#  index_provider_assignments_on_status              (status)
#
# Foreign Keys
#
#  fk_rails_...  (assigned_by_id => users.id)
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
class ProviderAssignment < ApplicationRecord
  belongs_to :service_request, optional: true
  belongs_to :booking, optional: true
  belongs_to :provider
  belongs_to :assigned_by, class_name: 'User'

  has_many :quotations, dependent: :nullify

  STATUSES = %w[
    assigned
    accepted
    rejected
    in_progress
    completed
    cancelled
    reassigned
  ].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :assigned_at, presence: true

  scope :active, -> { where(status: %w[assigned accepted in_progress]) }
  scope :recent, -> { order(created_at: :desc) }

  def can_accept?
    status == 'assigned'
  end

  def can_reject?
    status == 'assigned'
  end

  def can_start?
    status == 'accepted'
  end

  def can_complete?
    %w[accepted in_progress].include?(status)
  end

  def accept!(notes: nil, by_user: nil)
    raise InvalidTransitionError, "Cannot accept assignment in #{status} status" unless can_accept?

    transaction do
      update!(
        status: 'accepted',
        accepted_at: Time.current,
        internal_notes: notes.presence || internal_notes
      )
      booking.assign_provider! if booking.present? && booking.pending_review? && booking.may_assign_provider?
      service_request.update!(status: 'contacting_provider') if service_request.present? && service_request.status == 'pending_review'
      StatusHistory.create!(
        entity_type: 'ProviderAssignment',
        entity_id: id,
        previous_status: 'assigned',
        new_status: 'accepted',
        changed_by: by_user&.id || assigned_by_id,
        notes: notes || 'Provider accepted service assignment'
      )
    end
  end

  def reject!(reason:, notes: nil)
    raise InvalidTransitionError, "Cannot reject assignment in #{status} status" unless can_reject?
    raise ArgumentError, "Rejection reason is required" if reason.blank?

    transaction do
      update!(
        status: 'rejected',
        rejected_at: Time.current,
        rejection_reason: reason,
        internal_notes: notes.presence || internal_notes
      )
      quotations.where(status: %w[draft submitted pending]).update_all(status: 'withdrawn')

      booking&.update!(provider_id: nil)
      service_request&.update!(provider_id: nil)

      StatusHistory.create!(
        entity_type: 'ProviderAssignment',
        entity_id: id,
        previous_status: 'assigned',
        new_status: 'rejected',
        changed_by: assigned_by_id,
        notes: "Provider rejected assignment: #{reason}"
      )
    end
  end

  def start_service!(notes: nil)
    raise InvalidTransitionError, "Cannot start service in #{status} status" unless can_start?

    transaction do
      update!(status: 'in_progress', internal_notes: notes.presence || internal_notes)
      booking.start_service! if booking.present? && booking.may_start_service?
      service_request.transition_to!('in_progress', notes: 'Service in progress by provider') if service_request.present? && service_request.can_transition_to?('in_progress')
    end
  end

  def complete!(notes: nil)
    raise InvalidTransitionError, "Cannot complete service in #{status} status" unless can_complete?

    transaction do
      update!(status: 'completed', completed_at: Time.current, internal_notes: notes.presence || internal_notes)
      booking.complete! if booking.present? && booking.may_complete?
      service_request.transition_to!('completed', notes: 'Service marked completed by provider') if service_request.present? && service_request.can_transition_to?('completed')
    end
  end

  def reassign_to!(new_provider, by_user:, notes: nil)
    transaction do
      update!(status: 'reassigned', internal_notes: notes.presence || internal_notes)
      quotations.where(status: %w[draft submitted pending]).update_all(status: 'withdrawn')

      if booking.present?
        booking.provider_assignments.create!(
          provider: new_provider,
          assigned_by: by_user,
          assigned_at: Time.current,
          status: 'assigned',
          internal_notes: "Reassigned from #{provider.name}. #{notes}"
        )
        booking.update!(provider: new_provider)
      end

      if service_request.present?
        service_request.provider_assignments.create!(
          provider: new_provider,
          assigned_by: by_user,
          assigned_at: Time.current,
          status: 'assigned',
          internal_notes: "Reassigned from #{provider.name}. #{notes}"
        )
        service_request.update!(provider: new_provider)
      end
    end
  end
end
