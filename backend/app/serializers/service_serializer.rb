# == Schema Information
#
# Table name: services
#
#  id                         :bigint           not null, primary key
#  active                     :boolean          default(TRUE)
#  addons                     :jsonb            not null
#  booking_type               :string           default("quotation"), not null
#  builder_config             :jsonb            not null
#  coming_soon                :boolean          default(FALSE), not null
#  description                :text
#  estimated_duration_minutes :integer
#  fixed_price                :decimal(10, 2)
#  image_url                  :string
#  name                       :string           not null
#  position                   :integer          default(0), not null
#  pricing_type               :string           default("quotation"), not null
#  short_description          :text
#  slug                       :string
#  sort_order                 :integer          default(0)
#  supported_vehicle_types    :jsonb
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  category_id                :bigint           not null
#  subcategory_id             :bigint
#
# Indexes
#
#  index_services_on_active                  (active)
#  index_services_on_booking_type            (booking_type)
#  index_services_on_category_id             (category_id)
#  index_services_on_category_id_and_active  (category_id,active)
#  index_services_on_coming_soon             (coming_soon)
#  index_services_on_position                (position)
#  index_services_on_pricing_type            (pricing_type)
#  index_services_on_slug                    (slug)
#  index_services_on_subcategory_id          (subcategory_id)
#
# Foreign Keys
#
#  fk_rails_...  (category_id => categories.id)
#  fk_rails_...  (subcategory_id => subcategories.id)
#
class ServiceSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :short_description, :pricing_type, :booking_type,
             :fixed_price, :image_url, :estimated_duration_minutes,
             :category_id, :subcategory_id, :active, :coming_soon, :position,
             :supported_vehicle_types, :builder_config, :addons,
             :category, :subcategory

  def fixed_price
    object.fixed_price&.to_f
  end

  def category
    return nil unless object.category

    {
      id: object.category.id,
      name: object.category.name,
      slug: object.category.slug,
      coming_soon: object.category.coming_soon
    }
  end

  def subcategory
    return nil unless object.subcategory

    {
      id: object.subcategory.id,
      name: object.subcategory.name,
      slug: object.subcategory.slug
    }
  end
end
