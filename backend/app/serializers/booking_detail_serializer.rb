class BookingDetailSerializer < ActiveModel::Serializer
  attributes :id, :reference_number, :status, :scheduled_at, :preferred_at,
             :description, :booking_type, :vehicle_type, :duration_hours, :selected_options,
             :cancellation_reason, :admin_notes, :rating, :feedback,
             :total_paid, :payment_amount, :fully_paid,
             :current_assignment, :created_at

  belongs_to :user, serializer: UserSerializer
  belongs_to :service, serializer: ServiceDetailSerializer
  belongs_to :service_variant, serializer: ServiceVariantSerializer
  belongs_to :address, serializer: AddressSerializer
  belongs_to :provider, serializer: ProviderSerializer
  belongs_to :quotation, serializer: QuotationSerializer
  has_many :payments, serializer: PaymentSerializer
  has_many :request_attachments
  has_many :provider_assignments, serializer: ProviderAssignmentSerializer
  has_many :communications, serializer: CommunicationSerializer

  def quotation
    object.active_quotation
  end

  def reference_number
    object.reference_number || object.service_request&.reference_number
  end

  def current_assignment
    assignment = object.current_assignment || object.service_request&.current_assignment
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

  def total_paid
    object.total_paid.to_f
  end

  def payment_amount
    object.payment_amount&.to_f
  end

  def fully_paid
    object.fully_paid?
  end

  def scheduled_at
    object.scheduled_at&.iso8601
  end

  def preferred_at
    object.preferred_at&.iso8601
  end

  def created_at
    object.created_at.iso8601
  end
end
