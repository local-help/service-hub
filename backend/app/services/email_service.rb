# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

class EmailService
  class << self
    def send_booking_confirmation(booking)
      return unless booking&.user&.email.present?

      deliver_with_fallback do
        NotificationMailer.booking_confirmed(booking).deliver_now
      end
    rescue StandardError => e
      Rails.logger.error("[EmailService] Failed to send booking confirmation email: #{e.message}")
    end

    def send_booking_status_update(booking, old_status, new_status)
      return unless booking&.user&.email.present?

      deliver_with_fallback do
        NotificationMailer.booking_status_updated(booking, old_status, new_status).deliver_now
      end
    rescue StandardError => e
      Rails.logger.error("[EmailService] Failed to send booking status update email: #{e.message}")
    end

    def send_booking_cancellation(booking, reason)
      return unless booking&.user&.email.present?

      deliver_with_fallback do
        NotificationMailer.booking_cancelled(booking, reason).deliver_now
      end
    rescue StandardError => e
      Rails.logger.error("[EmailService] Failed to send booking cancellation email: #{e.message}")
    end

    def send_welcome_email(user)
      return unless user&.email.present?

      deliver_with_fallback do
        NotificationMailer.welcome_email(user).deliver_now
      end
    rescue StandardError => e
      Rails.logger.error("[EmailService] Failed to send welcome email: #{e.message}")
    end

    def send_test_email(to_email, subject = nil, message = nil)
      subject ||= 'Test Notification from LocalHelp (Render Integration)'
      message ||= 'This is a test notification email sent from Render to verify your email integration is functioning properly.'

      # If direct Resend API requested or ActionMailer fails, try direct Resend API
      if ENV['RESEND_API_KEY'].present? && ENV['EMAIL_DELIVERY_MODE'] == 'resend_api'
        html = <<~HTML
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="background-color: #176B65; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px;">LocalHelp Notification</h2>
            </div>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">#{message}</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              Sent via Resend HTTP API from Render at #{Time.current.iso8601}
            </div>
          </div>
        HTML
        return deliver_via_resend_api(to: to_email, subject: subject, html: html, text: message)
      end

      # Default: ActionMailer
      mail = NotificationMailer.test_email(to_email, subject, message)
      mail.deliver_now

      { success: true, method: ActionMailer::Base.delivery_method.to_s, message: 'Test email dispatched via ActionMailer' }
    rescue StandardError => e
      Rails.logger.warn("[EmailService] ActionMailer delivery failed, attempting Resend API fallback: #{e.message}")

      if ENV['RESEND_API_KEY'].present?
        html = "<p>#{message}</p><p><small>Fallback delivery via Resend API</small></p>"
        deliver_via_resend_api(to: to_email, subject: subject, html: html, text: message)
      else
        raise e
      end
    end

    # Direct delivery via Resend HTTPS REST API (Port 443 - zero firewall/port issues on Render)
    def deliver_via_resend_api(to:, subject:, html:, text: nil)
      api_key = ENV['RESEND_API_KEY']
      raise 'RESEND_API_KEY is not configured' unless api_key.present?

      uri = URI.parse('https://api.resend.com/emails')
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 10

      from_address = ENV.fetch('EMAIL_FROM', 'LocalHelp <onboarding@resend.dev>')

      payload = {
        from: from_address,
        to: Array(to),
        subject: subject,
        html: html
      }
      payload[:text] = text if text.present?

      req = Net::HTTP::Post.new(uri.request_uri)
      req['Authorization'] = "Bearer #{api_key}"
      req['Content-Type'] = 'application/json'
      req.body = payload.to_json

      response = http.request(req)
      body = JSON.parse(response.body) rescue { 'raw' => response.body }

      if response.is_a?(Net::HTTPSuccess)
        Rails.logger.info("[EmailService] Resend API delivered successfully: #{body['id']}")
        { success: true, method: 'resend_api', id: body['id'] }
      else
        error_msg = body['message'] || response.message
        Rails.logger.error("[EmailService] Resend API error: #{error_msg}")
        { success: false, method: 'resend_api', error: error_msg }
      end
    end

    private

    def deliver_with_fallback
      yield
    rescue StandardError => e
      Rails.logger.error("[EmailService] Delivery error: #{e.message}")
    end
  end
end

