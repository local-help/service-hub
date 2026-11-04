class OtpVerification < ApplicationRecord
  validates :phone, presence: true
  validates :otp_digest, presence: true
  validates :expires_at, presence: true
  validates :purpose, presence: true

  OTP_MAX_ATTEMPTS = 5
  OTP_EXPIRY = 5.minutes
  OTP_RESEND_COOLDOWN = 60.seconds
  OTP_HOURLY_RATE_LIMIT = 5

  scope :active, -> { where(verified_at: nil).where("expires_at > ?", Time.current) }
  scope :for_phone, ->(phone) { where(phone: phone) }
  scope :recent, ->(phone) { for_phone(phone).where("created_at > ?", 1.hour.ago) }

  def expired?
    expires_at < Time.current
  end

  def verified?
    verified_at.present?
  end

  def max_attempts_reached?
    attempts >= OTP_MAX_ATTEMPTS
  end

  def increment_attempts!
    increment!(:attempts)
  end

  def mark_verified!
    update!(verified_at: Time.current)
  end

  def self.can_send_otp?(phone)
    recent(phone).count < OTP_HOURLY_RATE_LIMIT
  end

  def self.cooldown_remaining(phone)
    last_otp = for_phone(phone).order(created_at: :desc).first
    return 0 unless last_otp
    remaining = OTP_RESEND_COOLDOWN - (Time.current - last_otp.created_at)
    [remaining, 0].max
  end
end
