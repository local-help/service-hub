# frozen_string_literal: true

Rails.application.configure do
  # Determine app host for links in notification emails
  app_host = ENV.fetch('APP_HOST') do
    if ENV['RENDER_EXTERNAL_HOSTNAME'].present?
      ENV['RENDER_EXTERNAL_HOSTNAME']
    else
      'localhost:3000'
    end
  end

  protocol = if ENV['RENDER_EXTERNAL_HOSTNAME'].present? || ENV['APP_HOST'].to_s.start_with?('https')
               'https'
             else
               'http'
             end

  config.action_mailer.default_url_options = {
    host: app_host.sub(%r{\Ahttps?://}, '').chomp('/'),
    protocol: protocol
  }

  # ActionMailer delivery configuration
  # On Render and modern cloud hosts, outbound port 25 is blocked.
  # We configure SMTP over port 587 with STARTTLS (or direct API fallback via Resend).
  if ENV['RESEND_API_KEY'].present?
    # Resend SMTP Configuration (Port 587 with STARTTLS works cleanly on Render)
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: ENV.fetch('SMTP_ADDRESS', 'smtp.resend.com'),
      port: ENV.fetch('SMTP_PORT', 587).to_i,
      user_name: ENV.fetch('SMTP_USERNAME', 'resend'),
      password: ENV['RESEND_API_KEY'],
      authentication: :plain,
      enable_starttls_auto: true
    }
    config.action_mailer.raise_delivery_errors = true
  elsif ENV['SMTP_ADDRESS'].present?
    # Generic SMTP Provider (SendGrid, Postmark, Mailgun, Brevo, AWS SES)
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: ENV['SMTP_ADDRESS'],
      port: ENV.fetch('SMTP_PORT', 587).to_i,
      user_name: ENV['SMTP_USERNAME'],
      password: ENV['SMTP_PASSWORD'],
      domain: ENV.fetch('SMTP_DOMAIN', 'localhelp.in'),
      authentication: ENV.fetch('SMTP_AUTHENTICATION', 'plain').to_sym,
      enable_starttls_auto: true
    }
    config.action_mailer.raise_delivery_errors = true
  elsif Rails.env.development?
    # Local development without external credentials: save emails to tmp/mails for inspection
    FileUtils.mkdir_p(Rails.root.join('tmp/mails'))
    config.action_mailer.delivery_method = :file
    config.action_mailer.file_settings = { location: Rails.root.join('tmp/mails') }
    config.action_mailer.raise_delivery_errors = false
  elsif Rails.env.test?
    config.action_mailer.delivery_method = :test
    config.action_mailer.raise_delivery_errors = false
  else
    # Production without explicit SMTP configured: fallback to file/log so requests don't fail
    FileUtils.mkdir_p(Rails.root.join('tmp/mails'))
    config.action_mailer.delivery_method = :file
    config.action_mailer.file_settings = { location: Rails.root.join('tmp/mails') }
    config.action_mailer.raise_delivery_errors = false
  end
end

