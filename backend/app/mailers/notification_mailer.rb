# frozen_string_literal: true

class NotificationMailer < ApplicationMailer
  def booking_confirmed(booking)
    @booking = booking
    @user = booking.user
    @service = booking.service
    @address = booking.address
    @portal_url = portal_url_for("bookings")

    return unless @user&.email.present?

    mail(
      to: @user.email,
      subject: "Booking Confirmed: #{@service.name} (#{@booking.reference_number})"
    )
  end

  def booking_status_updated(booking, old_status = nil, new_status = nil)
    @booking = booking
    @user = booking.user
    @service = booking.service
    @old_status = old_status
    @new_status = new_status || booking.status
    @provider = booking.provider
    @portal_url = portal_url_for("bookings")

    return unless @user&.email.present?

    subject = case @new_status
              when 'provider_assigned'
                "Professional Assigned: #{@service.name} (#{@booking.reference_number})"
              when 'in_progress'
                "Service Underway: #{@service.name} (#{@booking.reference_number})"
              when 'completed'
                "Service Completed: #{@service.name} (#{@booking.reference_number})"
              when 'rescheduled'
                "Booking Rescheduled: #{@service.name} (#{@booking.reference_number})"
              else
                "Booking Status Update: #{@service.name} (#{@new_status.to_s.humanize})"
              end

    mail(to: @user.email, subject: subject)
  end

  def booking_cancelled(booking, reason = nil)
    @booking = booking
    @user = booking.user
    @service = booking.service
    @reason = reason || booking.cancellation_reason || 'Cancelled by customer'
    @portal_url = portal_url_for("bookings")

    return unless @user&.email.present?

    mail(
      to: @user.email,
      subject: "Booking Cancelled: #{@service.name} (#{@booking.reference_number})"
    )
  end

  def welcome_email(user)
    @user = user
    @portal_url = portal_url_for("")

    return unless @user&.email.present?

    mail(
      to: @user.email,
      subject: "Welcome to LocalHelp – Fast, Reliable Local Services"
    )
  end

  def test_email(to_email, subject = nil, message = nil)
    @to_email = to_email
    @custom_message = message || 'This is a test notification email sent from Render to verify your email integration is functioning properly.'
    @sent_at = Time.current

    mail(
      to: to_email,
      subject: subject || 'Test Notification from LocalHelp (Render Integration)'
    )
  end

  private

  def portal_url_for(path)
    host = ENV.fetch('APP_HOST') do
      if ENV['RENDER_EXTERNAL_HOSTNAME'].present?
        "https://#{ENV['RENDER_EXTERNAL_HOSTNAME']}"
      else
        'http://localhost:3000'
      end
    end
    host = "https://#{host}" unless host.start_with?('http://', 'https://')
    path.present? ? "#{host.chomp('/')}/#{path}" : host
  end
end
