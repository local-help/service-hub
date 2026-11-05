# == Schema Information
#
# Table name: subcategories
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE), not null
#  description :text
#  name        :string           not null
#  position    :integer          default(0), not null
#  slug        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  category_id :bigint           not null
#
# Indexes
#
#  index_subcategories_on_active                (active)
#  index_subcategories_on_category_id           (category_id)
#  index_subcategories_on_category_id_and_slug  (category_id,slug) UNIQUE
#  index_subcategories_on_position              (position)
#
# Foreign Keys
#
#  fk_rails_...  (category_id => categories.id)
#
class SubcategorySerializer < ActiveModel::Serializer
  attributes :id, :category_id, :name, :slug, :description, :position, :active, :services_count

  def services_count
    object.services.active.count
  end
end
