class ServiceRequestDetailSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :description, :preferred_at,
             :assigned_by, :assigned_at, :admin_notes, :cancellation_reason,
             :current_assignment, :created_at

  belongs_to :user, serializer: UserSerializer
  belongs_to :service, serializer: ServiceDetailSerializer
  belongs_to :service_variant, serializer: ServiceVariantSerializer
  belongs_to :address, serializer: AddressSerializer
  belongs_to :provider, serializer: ProviderSerializer
  has_one :quotation, serializer: QuotationSerializer
  has_one :booking, serializer: BookingSerializer
  has_many :provider_assignments, serializer: ProviderAssignmentSerializer
  has_many :communications, serializer: CommunicationSerializer
  has_many :request_attachments

  def current_assignment
    assignment = object.current_assignment
    return nil unless assignment

    {
      id: assignment.id,
      provider_id: assignment.provider_id,
      provider_name: assignment.provider.name,
      status: assignment.status,
      assigned_at: assignment.assigned_at&.iso8601,
      accepted_at: assignment.accepted_at&.iso8601,
      internal_notes: assignment.internal_notes
    }
  end

  def preferred_at
    object.preferred_at&.iso8601
  end

  def assigned_at
    object.assigned_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
