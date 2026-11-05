class RequestAttachment < ApplicationRecord
  belongs_to :service_request, optional: true
  belongs_to :booking, optional: true

  validates :file_url, presence: true
  validates :content_type, inclusion: {
    in: %w[image/jpeg image/png image/webp image/heic application/pdf],
    message: "must be JPEG, PNG, WebP, HEIC, or PDF"
  }, allow_nil: true
  validate :file_size_within_limit

  MAX_FILE_SIZE = 10.megabytes

  private

  def file_size_within_limit
    if file_size.present? && file_size > MAX_FILE_SIZE
      errors.add(:file_size, "must be less than 10MB")
    end
  end
end
