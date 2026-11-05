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
  include AASM

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

  aasm column: 'status' do
    state :assigned, initial: true
    state :accepted
    state :rejected
    state :in_progress
    state :completed
    state :cancelled
    state :reassigned

    event :accept, before: :on_accept, after: :log_status_change do
      transitions from: :assigned, to: :accepted
    end

    event :reject, before: :on_reject, after: :log_status_change do
      transitions from: :assigned, to: :rejected
    end

    event :start_service, before: :on_start_service, after: :log_status_change do
      transitions from: :accepted, to: :in_progress
    end

    event :complete, before: :on_complete, after: :log_status_change do
      transitions from: %i[accepted in_progress], to: :completed
    end

    event :cancel, after: :log_status_change do
      transitions from: %i[assigned accepted in_progress], to: :cancelled
    end

    event :reassign, before: :on_reassign, after: :log_status_change do
      transitions from: %i[assigned accepted in_progress], to: :reassigned
    end
  end

  validates :status, inclusion: { in: STATUSES }
  validates :assigned_at, presence: true

  scope :active, -> { where(status: %w[assigned accepted in_progress]) }
  scope :recent, -> { order(created_at: :desc) }

  def can_accept?
    may_accept?
  end

  def can_reject?
    may_reject?
  end

  def can_start?
    may_start_service?
  end

  def can_complete?
    may_complete?
  end

  def can_cancel?
    may_cancel?
  end

  def can_reassign?
    may_reassign?
  end

  def can_transition_to?(new_status)
    aasm.permitted_transitions.any? { |t| t[:state].to_s == new_status.to_s }
  end

  def reassign_to!(new_provider, by_user:, notes: nil)
    reassign!(new_provider: new_provider, by_user: by_user, notes: notes)
  end

  private

  def on_accept(*args)
    opts = args.extract_options!
    notes = opts[:notes]
    self.accepted_at = Time.current
    self.internal_notes = notes.presence || internal_notes

    booking.assign_provider! if booking.present? && booking.pending_review? && booking.may_assign_provider?
    service_request.update!(status: 'contacting_provider') if service_request.present? && service_request.status == 'pending_review'
  end

  def on_reject(*args)
    opts = args.extract_options!
    reason = opts[:reason]
    notes = opts[:notes]
    raise ArgumentError, 'Rejection reason is required' if reason.blank?

    self.rejected_at = Time.current
    self.rejection_reason = reason
    self.internal_notes = notes.presence || internal_notes

    quotations.where(status: %w[draft submitted pending]).update_all(status: 'withdrawn')
    booking&.update!(provider_id: nil)
    service_request&.update!(provider_id: nil)
  end

  def on_start_service(*args)
    opts = args.extract_options!
    notes = opts[:notes]
    self.internal_notes = notes.presence || internal_notes

    booking.start_service! if booking.present? && booking.may_start_service?
    return unless service_request.present? && service_request.can_transition_to?('in_progress')

    service_request.transition_to!('in_progress', notes: 'Service in progress by provider')
  end

  def on_complete(*args)
    opts = args.extract_options!
    notes = opts[:notes]
    self.completed_at = Time.current
    self.internal_notes = notes.presence || internal_notes

    booking.complete! if booking.present? && booking.may_complete?
    return unless service_request.present? && service_request.can_transition_to?('completed')

    service_request.transition_to!('completed', notes: 'Service marked completed by provider')
  end

  def on_reassign(*args)
    opts = args.extract_options!
    new_provider = opts[:new_provider]
    by_user = opts[:by_user]
    notes = opts[:notes]
    self.internal_notes = notes.presence || internal_notes

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

    return unless service_request.present?

    service_request.provider_assignments.create!(
      provider: new_provider,
      assigned_by: by_user,
      assigned_at: Time.current,
      status: 'assigned',
      internal_notes: "Reassigned from #{provider.name}. #{notes}"
    )
    service_request.update!(provider: new_provider)
  end

  def log_status_change(*args)
    opts = args.extract_options!
    user = opts[:by_user] || opts[:changed_by] || assigned_by
    user_id = user.is_a?(User) ? user.id : user
    reason = opts[:reason]
    notes = opts[:notes] || (reason ? "Provider rejected assignment: #{reason}" : nil)

    StatusHistory.create!(
      entity_type: 'ProviderAssignment',
      entity_id: id,
      previous_status: aasm.from_state.to_s,
      new_status: aasm.to_state.to_s,
      changed_by: user_id,
      notes: notes
    )
  end
end
