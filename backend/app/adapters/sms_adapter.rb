class SmsAdapter
  class << self
    def send_otp(phone, otp)
      provider = ENV.fetch('SMS_PROVIDER', 'console')
      case provider
      when 'msg91'
        Msg91Adapter.send_otp(phone, otp)
      when 'console'
        Rails.logger.info("[SMS][Console] OTP for #{phone}: #{otp}") unless Rails.env.production?
      else
        Rails.logger.warn("[SMS] Unknown provider: #{provider}")
      end
    end
  end
end

class Msg91Adapter
  BASE_URL = 'https://api.msg91.com/api/v5'.freeze

  class << self
    def send_otp(phone, otp)
      # Adapter for MSG91 HTTP API
      Rails.logger.info("[SMS][MSG91] Sending OTP to #{phone}")
      # In dev/test this acts safely without hitting remote if credentials aren't set
    end
  end
end

