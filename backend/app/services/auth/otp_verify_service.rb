module Auth
  class OtpVerifyService < ApplicationService
    def initialize(phone:, otp:, request: nil)
      @phone = phone
      @otp = otp
      @request = request
    end

    def call
      return failure('Phone and OTP are required') if @phone.blank? || @otp.blank?

      otp_record = OtpVerification.active.for_phone(@phone)
                                  .where(purpose: 'login')
                                  .order(created_at: :desc)
                                  .first

      return failure('No active OTP found. Please request a new one.') unless otp_record
      return failure('OTP has expired') if otp_record.expired?

      return failure('Maximum verification attempts exceeded. Please request a new OTP.') if otp_record.max_attempts_reached?

      otp_digest = Digest::SHA256.hexdigest(@otp.to_s)
      otp_record.increment_attempts!

      unless ActiveSupport::SecurityUtils.secure_compare(otp_record.otp_digest, otp_digest)
        remaining = OtpVerification::OTP_MAX_ATTEMPTS - otp_record.attempts
        return failure("Invalid OTP. #{remaining} attempt(s) remaining.")
      end

      otp_record.mark_verified!

      user = User.find_by(phone: @phone)
      is_new_user = user.nil?

      if is_new_user
        user = User.create!(
          phone: @phone,
          name: 'User',
          role: 'customer',
          status: 'active',
          phone_verified: true
        )
      else
        user.update!(phone_verified: true) unless user.phone_verified?
      end

      access_token = JsonWebToken.generate_access_token(user)
      refresh_token = JsonWebToken.generate_refresh_token(user, @request)

      success(
        user: user,
        access_token: access_token,
        refresh_token: refresh_token,
        is_new_user: is_new_user
      )
    end
  end
end
