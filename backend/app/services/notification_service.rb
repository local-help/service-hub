# frozen_string_literal: true

class NotificationService
  class << self
    # ── CUSTOMER & PROVIDER: Booking Confirmed ───────────────────
    def notify_booking_confirmed(booking)
      return unless booking&.user

      # 1. In-app notification for Customer
      create_notification(
        user: booking.user,
        type: 'booking_confirmed',
        title: "Booking Confirmed: #{booking.service&.name}",
        body: "Your booking (#{booking.reference_number}) for #{formatted_time(booking.scheduled_at)} has been confirmed.",
        metadata: {
          booking_id: booking.id,
          reference_number: booking.reference_number,
          service_id: booking.service_id,
          action_url: '/bookings'
        }
      )

      # 2. Email notification for Customer
      EmailService.send_booking_confirmation(booking)

      # 3. If a provider is assigned, notify the provider organization's users
      if booking.provider.present?
        notify_provider_users(
          booking.provider,
          type: 'job_assigned',
          title: "New Job Assigned: #{booking.service&.name} (#{booking.reference_number})",
          body: "Doorstep job in #{booking.address&.landmark || booking.address&.city || 'Prayagraj'} on #{formatted_time(booking.scheduled_at)}.",
          metadata: {
            booking_id: booking.id,
            reference_number: booking.reference_number,
            action_url: '/provider/requests'
          }
        )
      end
    end

    # ── CUSTOMER & PROVIDER: Provider Assigned ────────────────────
    def notify_provider_assigned(booking, provider)
      return unless booking && provider

      # 1. In-app notification for Customer
      if booking.user.present?
        create_notification(
          user: booking.user,
          type: 'provider_assigned',
          title: "Professional Assigned: #{provider.name}",
          body: "#{provider.name} has been assigned to your booking (#{booking.reference_number}).",
          metadata: {
            booking_id: booking.id,
            provider_id: provider.id,
            reference_number: booking.reference_number,
            action_url: '/bookings'
          }
        )
        EmailService.send_booking_status_update(booking, booking.status, 'provider_assigned')
      end

      # 2. In-app notification for Provider's team
      notify_provider_users(
        provider,
        type: 'job_assigned',
        title: "New Job Assigned: #{booking.service&.name} (#{booking.reference_number})",
        body: "Customer: #{booking.user&.name}. Address: #{booking.address&.full_address || 'Address on file'}. Time: #{formatted_time(booking.scheduled_at)}.",
        metadata: {
          booking_id: booking.id,
          reference_number: booking.reference_number,
          action_url: '/provider/requests'
        }
      )
    end

    # ── CUSTOMER & PROVIDER: Status Updated ───────────────────────
    def notify_booking_status_updated(booking, old_status, new_status)
      return unless booking&.user

      title, body = status_messages_for(booking, new_status)

      # 1. In-app notification for Customer
      create_notification(
        user: booking.user,
        type: "booking_#{new_status}",
        title: title,
        body: body,
        metadata: {
          booking_id: booking.id,
          reference_number: booking.reference_number,
          old_status: old_status,
          new_status: new_status,
          action_url: '/bookings'
        }
      )

      # 2. Email notification for Customer
      EmailService.send_booking_status_update(booking, old_status, new_status)

      # 3. If rescheduled, notify the assigned provider team
      if new_status == 'rescheduled' && booking.provider.present?
        notify_provider_users(
          booking.provider,
          type: 'job_rescheduled',
          title: "Job Rescheduled: #{booking.reference_number}",
          body: "Booking for #{booking.service&.name} has been rescheduled to #{formatted_time(booking.scheduled_at)}.",
          metadata: {
            booking_id: booking.id,
            reference_number: booking.reference_number,
            action_url: '/provider/requests'
          }
        )
      end
    end

    # ── CUSTOMER: Quotation Received ──────────────────────────────
    def notify_quotation_received(quotation)
      user = quotation.booking&.user || quotation.service_request&.user
      return unless user.present?

      create_notification(
        user: user,
        type: 'quotation_received',
        title: "New Quote: ₹#{quotation.amount.to_i} from #{quotation.provider&.name}",
        body: "A quotation has been submitted for #{quotation.booking&.service&.name || 'your service request'}. Tap to review and approve.",
        metadata: {
          quotation_id: quotation.id,
          booking_id: quotation.booking_id,
          reference_number: quotation.reference_number,
          amount: quotation.amount,
          action_url: '/bookings'
        }
      )
    end

    # ── PROVIDER: Quotation Approved by Customer ──────────────────
    def notify_quotation_approved(quotation)
      # 1. Customer confirmation
      user = quotation.booking&.user || quotation.service_request&.user
      if user.present?
        create_notification(
          user: user,
          type: 'quotation_approved',
          title: "Quotation Approved (₹#{quotation.amount.to_i})",
          body: "You approved the quotation from #{quotation.provider&.name}. Your booking is now confirmed.",
          metadata: {
            quotation_id: quotation.id,
            booking_id: quotation.booking_id,
            action_url: '/bookings'
          }
        )
      end

      # 2. Provider Notification
      if quotation.provider.present?
        notify_provider_users(
          quotation.provider,
          type: 'quote_approved',
          title: "Quote Approved! (₹#{quotation.amount.to_i})",
          body: "Customer approved quote #{quotation.reference_number} for #{quotation.booking&.service&.name || 'service request'}. You may now proceed with the job.",
          metadata: {
            quotation_id: quotation.id,
            booking_id: quotation.booking_id,
            reference_number: quotation.reference_number,
            action_url: '/provider/requests'
          }
        )
      end
    end

    # ── PROVIDER: Quotation Rejected by Customer ──────────────────
    def notify_quotation_rejected(quotation, reason = nil)
      return unless quotation.provider.present?

      notify_provider_users(
        quotation.provider,
        type: 'quote_rejected',
        title: "Quote Declined: #{quotation.reference_number}",
        body: "Customer declined quotation for #{quotation.booking&.service&.name || 'service request'}.#{reason.present? ? " Note: #{reason}" : ''}",
        metadata: {
          quotation_id: quotation.id,
          booking_id: quotation.booking_id,
          action_url: '/provider/requests'
        }
      )
    end

    # ── CUSTOMER & PROVIDER: Booking Cancelled ────────────────────
    def notify_booking_cancelled(booking, reason = nil, cancelled_by = nil)
      # 1. Customer notification
      if booking.user.present?
        create_notification(
          user: booking.user,
          type: 'booking_cancelled',
          title: "Booking Cancelled: #{booking.service&.name}",
          body: "Booking #{booking.reference_number} has been cancelled.#{reason.present? ? " Reason: #{reason}" : ''}",
          metadata: {
            booking_id: booking.id,
            reference_number: booking.reference_number,
            reason: reason,
            action_url: '/bookings'
          }
        )
        EmailService.send_booking_cancellation(booking, reason)
      end

      # 2. Provider notification (if assigned)
      if booking.provider.present?
        notify_provider_users(
          booking.provider,
          type: 'job_cancelled',
          title: "Assigned Job Cancelled: #{booking.reference_number}",
          body: "Booking for #{booking.service&.name} (#{booking.reference_number}) scheduled for #{formatted_time(booking.scheduled_at)} was cancelled.",
          metadata: {
            booking_id: booking.id,
            reference_number: booking.reference_number,
            action_url: '/provider/requests'
          }
        )
      end
    end

    # ── WELCOME NOTIFICATION ──────────────────────────────────────
    def notify_welcome(user)
      return unless user.present?

      create_notification(
        user: user,
        type: 'welcome',
        title: 'Welcome to LocalHelp!',
        body: 'Your account is ready. Browse doorstep local services, book verified professionals, and track jobs in real time.',
        metadata: { action_url: '/' }
      )
      EmailService.send_welcome_email(user)
    end

    # ── HELPER: Create single in-app notification ─────────────────
    def create_notification(user:, type:, title:, body:, metadata: {})
      return unless user.present?

      user.notifications.create!(
        notification_type: type,
        title: title,
        body: body,
        metadata: metadata
      )
    rescue StandardError => e
      Rails.logger.error("[NotificationService] Error creating notification for user #{user&.id}: #{e.message}")
      nil
    end

    # ── HELPER: Notify all staff/managers in a provider org ───────
    def notify_provider_users(provider, type:, title:, body:, metadata: {})
      return unless provider.present?

      provider.users.find_each do |p_user|
        create_notification(
          user: p_user,
          type: type,
          title: title,
          body: body,
          metadata: metadata.merge(provider_id: provider.id)
        )
      end
    rescue StandardError => e
      Rails.logger.error("[NotificationService] Error notifying provider #{provider&.id} users: #{e.message}")
    end

    private

    def formatted_time(time)
      time.present? ? time.strftime('%a, %d %b at %I:%M %p') : 'Scheduled time'
    end

    def status_messages_for(booking, status)
      case status.to_s
      when 'provider_assigned'
        ["Professional Assigned: #{booking.provider&.name || 'Provider'}", "A verified local professional has been assigned to your booking (#{booking.reference_number})."]
      when 'in_progress'
        ["Service Underway: #{booking.service&.name}", "Your professional has arrived and started the service (#{booking.reference_number})."]
      when 'completed'
        ["Service Completed: #{booking.service&.name}", "Your doorstep service (#{booking.reference_number}) has been marked complete. Tap to rate your experience."]
      when 'rescheduled'
        ["Booking Rescheduled: #{booking.service&.name}", "Your booking (#{booking.reference_number}) is rescheduled to #{formatted_time(booking.scheduled_at)}."]
      else
        ["Status Update: #{status.to_s.humanize}", "Booking #{booking.reference_number} is now #{status.to_s.humanize}."]
      end
    end
  end
end
