# == Schema Information
#
# Table name: request_attachments
#
#  id                 :bigint           not null, primary key
#  content_type       :string
#  file_name          :string
#  file_size          :integer
#  file_url           :string           not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  booking_id         :bigint
#  service_request_id :bigint
#
# Indexes
#
#  index_request_attachments_on_booking_id          (booking_id)
#  index_request_attachments_on_service_request_id  (service_request_id)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
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
    return unless file_size.present? && file_size > MAX_FILE_SIZE

    errors.add(:file_size, "must be less than 10MB")
  end
end
