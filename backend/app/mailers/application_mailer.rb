class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("EMAIL_FROM", "LocalHelp <notifications@localhelp.com>")
  layout "mailer"
end
