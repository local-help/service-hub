class CreateStatusHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :status_histories do |t|
      t.string :entity_type, null: false
      t.bigint :entity_id, null: false
      t.string :previous_status
      t.string :new_status, null: false
      t.bigint :changed_by
      t.text :notes

      t.datetime :created_at, null: false
    end

    add_index :status_histories, [:entity_type, :entity_id]
    add_foreign_key :status_histories, :users, column: :changed_by
  end
end
