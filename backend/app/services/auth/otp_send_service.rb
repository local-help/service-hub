module Auth
  class OtpSendService < ApplicationService
    def initialize(phone)
      @phone = phone
    end

    def call
      return failure('Phone number is required') if @phone.blank?

      unless OtpVerification.can_send_otp?(@phone)
        return failure('Too many OTP requests. Please try again later.')
      end

      cooldown = OtpVerification.cooldown_remaining(@phone)
      if cooldown > 0
        return failure("Please wait #{cooldown.ceil} seconds before requesting a new OTP")
      end

      otp = generate_otp
      otp_digest = Digest::SHA256.hexdigest(otp)

      OtpVerification.create!(
        phone: @phone,
        otp_digest: otp_digest,
        expires_at: OtpVerification::OTP_EXPIRY.from_now,
        purpose: 'login'
      )

      # Send OTP via SMS adapter (background job in production)
      SmsAdapter.send_otp(@phone, otp) unless Rails.env.test?

      Rails.logger.info("[OTP] Sent to #{@phone[0..3]}****: #{otp}") unless Rails.env.production?

      success(cooldown: OtpVerification::OTP_RESEND_COOLDOWN.to_i)
    end

    private

    def generate_otp
      length = ENV.fetch('OTP_LENGTH', 6).to_i
      SecureRandom.random_number(10**length).to_s.rjust(length, '0')
    end
  end
end

