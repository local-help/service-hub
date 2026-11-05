# == Schema Information
#
# Table name: provider_availabilities
#
#  id                             :bigint           not null, primary key
#  is_available                   :boolean          default(TRUE), not null
#  operating_days                 :jsonb
#  temporary_unavailability_end   :datetime
#  temporary_unavailability_start :datetime
#  unavailability_reason          :text
#  working_hours_end              :string           default("20:00")
#  working_hours_start            :string           default("09:00")
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  provider_id                    :bigint           not null
#
# Indexes
#
#  index_provider_availabilities_on_provider_id  (provider_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (provider_id => providers.id)
#
class ProviderAvailabilitySerializer < ActiveModel::Serializer
  attributes :id, :provider_id, :is_available, :operating_days,
             :working_hours_start, :working_hours_end,
             :temporary_unavailability_start, :temporary_unavailability_end,
             :unavailability_reason, :currently_available

  def currently_available
    object.currently_available?
  end

  def temporary_unavailability_start
    object.temporary_unavailability_start&.iso8601
  end

  def temporary_unavailability_end
    object.temporary_unavailability_end&.iso8601
  end
end
