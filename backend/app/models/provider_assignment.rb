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

  def accept!(notes: nil)
    raise InvalidTransitionError, "Cannot accept assignment in #{status} status" unless can_accept?

    transaction do
      update!(
        status: 'accepted',
        accepted_at: Time.current,
        internal_notes: notes.presence || internal_notes
      )
      if booking.present? && booking.pending_review?
        booking.assign_provider! if booking.may_assign_provider?
      end
      if service_request.present? && service_request.status == 'pending_review'
        service_request.update!(status: 'contacting_provider')
      end
      StatusHistory.create!(
        entity_type: 'ProviderAssignment',
        entity_id: id,
        previous_status: 'assigned',
        new_status: 'accepted',
        changed_by: assigned_by_id,
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
      if booking.present? && booking.may_start_service?
        booking.start_service!
      end
      if service_request.present? && service_request.can_transition_to?('in_progress')
        service_request.transition_to!('in_progress', notes: 'Service in progress by provider')
      end
    end
  end

  def complete!(notes: nil)
    raise InvalidTransitionError, "Cannot complete service in #{status} status" unless can_complete?

    transaction do
      update!(status: 'completed', completed_at: Time.current, internal_notes: notes.presence || internal_notes)
      if booking.present? && booking.may_complete?
        booking.complete!
      end
      if service_request.present? && service_request.can_transition_to?('completed')
        service_request.transition_to!('completed', notes: 'Service marked completed by provider')
      end
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
