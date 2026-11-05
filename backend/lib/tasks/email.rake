# frozen_string_literal: true

namespace :email do
  desc "Send a test notification email from Render or local environment. Usage: rails email:test[your@email.com]"
  task :test, [:recipient] => :environment do |_t, args|
    recipient = args[:recipient] || ENV['TEST_EMAIL_RECIPIENT'] || 'test@example.com'
    puts "=================================================="
    puts "Testing Notification Email Sending from Render/Rails"
    puts "Recipient: #{recipient}"
    puts "Delivery Method: #{ActionMailer::Base.delivery_method}"
    puts "SMTP Address: #{ActionMailer::Base.smtp_settings[:address] rescue 'N/A'}"
    puts "SMTP Port: #{ActionMailer::Base.smtp_settings[:port] rescue 'N/A'}"
    puts "Resend API Key configured: #{ENV['RESEND_API_KEY'].present? ? 'Yes' : 'No'}"
    puts "=================================================="

    begin
      result = EmailService.send_test_email(recipient)
      puts " SUCCESS: Test email dispatched successfully!"
      puts "Result details: #{result.inspect}"
      puts " Emails saved to tmp/mails (local development mode)" if ActionMailer::Base.delivery_method == :file
    rescue StandardError => e
      puts " FAILED to dispatch email: #{e.message}"
      puts e.backtrace.first(5)
    end
  end
end
