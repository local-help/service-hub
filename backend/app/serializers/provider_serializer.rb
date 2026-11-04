class ProviderSerializer < ActiveModel::Serializer
  attributes :id, :name, :phone, :email, :address, :city, :service_area,
             :notes, :active, :created_at

  has_many :services, serializer: ServiceSerializer

  def created_at
    object.created_at.iso8601
  end
end

