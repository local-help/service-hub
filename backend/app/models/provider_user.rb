# == Schema Information
#
# Table name: provider_users
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE), not null
#  role        :string           default("owner"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  provider_id :bigint           not null
#  user_id     :bigint           not null
#
# Indexes
#
#  index_provider_users_on_active                   (active)
#  index_provider_users_on_provider_id              (provider_id)
#  index_provider_users_on_user_id                  (user_id)
#  index_provider_users_on_user_id_and_provider_id  (user_id,provider_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (provider_id => providers.id)
#  fk_rails_...  (user_id => users.id)
#
class ProviderUser < ApplicationRecord
  belongs_to :user
  belongs_to :provider

  enum :role, { owner: 'owner', manager: 'manager', staff: 'staff' }, prefix: true

  validates :role, presence: true
  validates :user_id, uniqueness: { scope: :provider_id }

  scope :active, -> { where(active: true) }
end
