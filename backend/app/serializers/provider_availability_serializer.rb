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

