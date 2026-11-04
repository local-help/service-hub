class CreateCommunications < ActiveRecord::Migration[8.0]
  def change
    create_table :communications do |t|
      t.references :service_request, null: false, foreign_key: true
      t.bigint :admin_user_id, null: false
      t.string :channel, null: false
      t.string :direction, null: false
      t.text :summary
      t.text :outcome
      t.datetime :communicated_at, null: false

      t.timestamps
    end

    add_index :communications, :channel
    add_foreign_key :communications, :users, column: :admin_user_id
  end
end
