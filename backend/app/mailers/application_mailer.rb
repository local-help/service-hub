class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("EMAIL_FROM", "LocalHelp <notifications@localhelp.in>")
  layout "mailer"
end
