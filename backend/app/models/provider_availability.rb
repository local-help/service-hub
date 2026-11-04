class ProviderAvailability < ApplicationRecord
  belongs_to :provider

  validates :provider_id, uniqueness: true

  def currently_available?
    return false unless is_available?

    now = Time.current
    day_name = now.strftime('%A').downcase
    return false if operating_days.present? && !operating_days.include?(day_name)

    if temporary_unavailability_start.present? && temporary_unavailability_end.present?
      if now.between?(temporary_unavailability_start, temporary_unavailability_end)
        return false
      end
    end

    true
  end
end
