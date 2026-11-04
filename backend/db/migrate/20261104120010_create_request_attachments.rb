class CreateRequestAttachments < ActiveRecord::Migration[8.0]
  def change
    create_table :request_attachments do |t|
      t.references :service_request, null: false, foreign_key: true
      t.string :file_url, null: false
      t.string :file_name
      t.string :content_type
      t.integer :file_size

      t.timestamps
    end
  end
end
