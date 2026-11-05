# == Schema Information
#
# Table name: categories
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE)
#  coming_soon :boolean          default(FALSE), not null
#  description :text
#  icon        :string
#  icon_name   :string
#  image_url   :string
#  name        :string           not null
#  position    :integer          default(0), not null
#  slug        :string
#  sort_order  :integer          default(0)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_categories_on_active       (active)
#  index_categories_on_coming_soon  (coming_soon)
#  index_categories_on_name         (name) UNIQUE
#  index_categories_on_position     (position)
#  index_categories_on_slug         (slug) UNIQUE
#  index_categories_on_sort_order   (sort_order)
#
class CategorySerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :description, :icon, :image_url, :icon_name,
             :position, :active, :coming_soon, :services_count, :subcategories_count

  def services_count
    object.services.active.count
  end

  def subcategories_count
    object.subcategories.active.count
  end
end
