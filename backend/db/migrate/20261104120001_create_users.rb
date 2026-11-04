class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email
      t.string :phone
      t.string :password_digest
      t.string :role, null: false, default: 'customer'
      t.string :status, null: false, default: 'active'
      t.boolean :phone_verified, default: false
      t.boolean :email_verified, default: false
      t.string :avatar_url

      t.timestamps
    end

    add_index :users, :email, unique: true, where: "email IS NOT NULL"
    add_index :users, :phone, unique: true, where: "phone IS NOT NULL"
    add_index :users, :role
    add_index :users, :status
  end
end
