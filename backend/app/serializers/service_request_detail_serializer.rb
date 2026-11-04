class ServiceRequestDetailSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :description, :preferred_at,
             :assigned_by, :assigned_at, :admin_notes, :cancellation_reason,
             :created_at

  belongs_to :user, serializer: UserSerializer
  belongs_to :service, serializer: ServiceDetailSerializer
  belongs_to :address, serializer: AddressSerializer
  belongs_to :provider, serializer: ProviderSerializer
  has_one :quotation, serializer: QuotationSerializer
  has_one :booking, serializer: BookingSerializer
  has_many :communications, serializer: CommunicationSerializer
  has_many :request_attachments

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

