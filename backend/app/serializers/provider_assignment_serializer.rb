class ProviderAssignmentSerializer < ActiveModel::Serializer
  attributes :id, :service_request_id, :provider_id, :assigned_by_id,
             :status, :assigned_at, :accepted_at, :rejected_at, :completed_at,
             :rejection_reason, :internal_notes, :created_at, :updated_at,
             :provider_name, :service_request

  def provider_name
    object.provider&.name
  end

  def service_request
    sr = object.service_request
    return nil unless sr

    {
      id: sr.id,
      reference_number: sr.reference_number,
      status: sr.status,
      description: sr.description,
      preferred_at: sr.preferred_at&.iso8601,
      customer_name: sr.user&.name,
      customer_phone: sr.user&.phone,
      service_id: sr.service_id,
      service_name: sr.service&.name,
      service_category: sr.service&.category&.name,
      service_variant_name: sr.service_variant&.name,
      pricing_type: sr.service&.pricing_type,
      fixed_price: sr.service&.fixed_price&.to_f,
      address: sr.address ? {
        id: sr.address.id,
        label: sr.address.label,
        address_line: sr.address.address_line,
        landmark: sr.address.landmark,
        city: sr.address.city,
        state: sr.address.state,
        postal_code: sr.address.postal_code,
        formatted: sr.address.respond_to?(:full_address) ? sr.address.full_address : [sr.address.address_line, sr.address.city, sr.address.postal_code].compact.join(', ')
      } : nil,
      active_quotation: sr.active_quotation ? {
        id: sr.active_quotation.id,
        amount: sr.active_quotation.amount&.to_f,
        description: sr.active_quotation.description,
        status: sr.active_quotation.status,
        valid_until: sr.active_quotation.valid_until&.iso8601
      } : nil
    }
  end

  def assigned_at
    object.assigned_at&.iso8601
  end

  def accepted_at
    object.accepted_at&.iso8601
  end

  def rejected_at
    object.rejected_at&.iso8601
  end

  def completed_at
    object.completed_at&.iso8601
  end

  def created_at
    object.created_at&.iso8601
  end

  def updated_at
    object.updated_at&.iso8601
  end
end
