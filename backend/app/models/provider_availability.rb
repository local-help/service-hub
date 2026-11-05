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
class ProviderAvailability < ApplicationRecord
  belongs_to :provider

  validates :provider_id, uniqueness: true

  def currently_available?
    return false unless is_available?

    now = Time.current
    day_name = now.strftime('%A').downcase
    return false if operating_days.present? && operating_days.exclude?(day_name)

    if temporary_unavailability_start.present? && temporary_unavailability_end.present? && now.between?(temporary_unavailability_start,
                                                                                                        temporary_unavailability_end)
      return false
    end

    true
  end
end
