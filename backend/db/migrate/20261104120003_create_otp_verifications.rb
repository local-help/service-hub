class CreateOtpVerifications < ActiveRecord::Migration[8.0]
  def change
    create_table :otp_verifications do |t|
      t.string :phone, null: false
      t.string :otp_digest, null: false
      t.integer :attempts, default: 0
      t.datetime :expires_at, null: false
      t.datetime :verified_at
      t.string :purpose, null: false, default: 'login'

      t.timestamps
    end

    add_index :otp_verifications, [:phone, :purpose]
    add_index :otp_verifications, :expires_at
  end
end
