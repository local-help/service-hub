# == Schema Information
#
# Table name: quotations
#
#  id                        :bigint           not null, primary key
#  amount                    :decimal(10, 2)   not null
#  created_by                :bigint           not null
#  description               :text
#  estimated_completion_time :string
#  reviewed_at               :datetime
#  status                    :string           default("pending"), not null
#  valid_until               :datetime         not null
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  booking_id                :bigint
#  provider_assignment_id    :bigint
#  provider_id               :bigint
#  reviewed_by_id            :bigint
#  service_request_id        :bigint
#
# Indexes
#
#  index_quotations_on_active_per_request      (service_request_id) UNIQUE WHERE ((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'pending'::character varying, 'approved'::character varying])::text[]))
#  index_quotations_on_booking_id              (booking_id)
#  index_quotations_on_provider_assignment_id  (provider_assignment_id)
#  index_quotations_on_provider_id             (provider_id)
#  index_quotations_on_status                  (status)
#
# Foreign Keys
#
#  fk_rails_...  (booking_id => bookings.id)
#  fk_rails_...  (created_by => users.id)
#  fk_rails_...  (provider_assignment_id => provider_assignments.id)
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (reviewed_by_id => users.id)
#  fk_rails_...  (service_request_id => service_requests.id)
#
class QuotationSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :amount, :description, :status,
             :valid_until, :created_by, :is_expired, :created_at

  def amount
    object.amount.to_f
  end

  def is_expired
    object.expired?
  end

  def valid_until
    object.valid_until.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
