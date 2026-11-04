# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_11_04_120019) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "addresses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "label"
    t.string "address_line", null: false
    t.string "landmark"
    t.string "city", null: false
    t.string "state", null: false
    t.string "postal_code", null: false
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.boolean "is_default", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "is_default"], name: "index_addresses_on_user_id_and_is_default"
    t.index ["user_id"], name: "index_addresses_on_user_id"
  end

  create_table "admin_activity_logs", force: :cascade do |t|
    t.bigint "admin_user_id", null: false
    t.string "action", null: false
    t.string "entity_type"
    t.bigint "entity_id"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.index ["admin_user_id"], name: "index_admin_activity_logs_on_admin_user_id"
    t.index ["created_at"], name: "index_admin_activity_logs_on_created_at"
    t.index ["entity_type", "entity_id"], name: "index_admin_activity_logs_on_entity_type_and_entity_id"
  end

  create_table "bookings", force: :cascade do |t|
    t.bigint "service_request_id", null: false
    t.bigint "quotation_id"
    t.datetime "scheduled_at"
    t.string "status", default: "confirmed", null: false
    t.text "cancellation_reason"
    t.text "admin_notes"
    t.integer "rating"
    t.text "feedback"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["quotation_id"], name: "index_bookings_on_quotation_id"
    t.index ["scheduled_at"], name: "index_bookings_on_scheduled_at"
    t.index ["service_request_id"], name: "index_bookings_on_service_request_id", unique: true
    t.index ["status"], name: "index_bookings_on_status"
  end

  create_table "categories", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "image_url"
    t.string "icon_name"
    t.integer "sort_order", default: 0
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_categories_on_active"
    t.index ["name"], name: "index_categories_on_name", unique: true
    t.index ["sort_order"], name: "index_categories_on_sort_order"
  end

  create_table "communications", force: :cascade do |t|
    t.bigint "service_request_id", null: false
    t.bigint "admin_user_id", null: false
    t.string "channel", null: false
    t.string "direction", null: false
    t.text "summary"
    t.text "outcome"
    t.datetime "communicated_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["channel"], name: "index_communications_on_channel"
    t.index ["service_request_id"], name: "index_communications_on_service_request_id"
  end

  create_table "device_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token", null: false
    t.string "platform", null: false
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_device_tokens_on_token", unique: true
    t.index ["user_id", "active"], name: "index_device_tokens_on_user_id_and_active"
    t.index ["user_id"], name: "index_device_tokens_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "notification_type", null: false
    t.string "title", null: false
    t.text "body"
    t.jsonb "metadata", default: {}
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_notifications_on_user_id_and_created_at"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "otp_verifications", force: :cascade do |t|
    t.string "phone", null: false
    t.string "otp_digest", null: false
    t.integer "attempts", default: 0
    t.datetime "expires_at", null: false
    t.datetime "verified_at"
    t.string "purpose", default: "login", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_otp_verifications_on_expires_at"
    t.index ["phone", "purpose"], name: "index_otp_verifications_on_phone_and_purpose"
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "booking_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "method", null: false
    t.string "status", default: "pending", null: false
    t.string "gateway_reference"
    t.string "gateway_order_id"
    t.jsonb "gateway_metadata", default: {}
    t.bigint "recorded_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["booking_id"], name: "index_payments_on_booking_id"
    t.index ["gateway_order_id"], name: "index_payments_on_gateway_order_id", unique: true, where: "(gateway_order_id IS NOT NULL)"
    t.index ["gateway_reference"], name: "index_payments_on_gateway_reference", unique: true, where: "(gateway_reference IS NOT NULL)"
    t.index ["status"], name: "index_payments_on_status"
  end

  create_table "platform_settings", force: :cascade do |t|
    t.string "key", null: false
    t.text "value"
    t.string "value_type", default: "string", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_platform_settings_on_key", unique: true
  end

  create_table "provider_services", force: :cascade do |t|
    t.bigint "provider_id", null: false
    t.bigint "service_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["provider_id", "service_id"], name: "index_provider_services_on_provider_id_and_service_id", unique: true
    t.index ["provider_id"], name: "index_provider_services_on_provider_id"
    t.index ["service_id"], name: "index_provider_services_on_service_id"
  end

  create_table "providers", force: :cascade do |t|
    t.string "name", null: false
    t.string "phone", null: false
    t.string "email"
    t.text "address"
    t.string "city"
    t.string "service_area"
    t.text "notes"
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_providers_on_active"
    t.index ["city"], name: "index_providers_on_city"
    t.index ["phone"], name: "index_providers_on_phone"
  end

  create_table "quotations", force: :cascade do |t|
    t.bigint "service_request_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.text "description"
    t.string "status", default: "pending", null: false
    t.datetime "valid_until", null: false
    t.bigint "created_by", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["service_request_id"], name: "index_quotations_on_service_request_id", unique: true
    t.index ["status"], name: "index_quotations_on_status"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.string "device_info"
    t.inet "ip_address"
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_refresh_tokens_on_expires_at"
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "request_attachments", force: :cascade do |t|
    t.bigint "service_request_id", null: false
    t.string "file_url", null: false
    t.string "file_name"
    t.string "content_type"
    t.integer "file_size"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["service_request_id"], name: "index_request_attachments_on_service_request_id"
  end

  create_table "service_requests", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "service_id", null: false
    t.bigint "address_id", null: false
    t.bigint "provider_id"
    t.string "reference_number", null: false
    t.text "description", null: false
    t.datetime "preferred_at"
    t.string "status", default: "pending_review", null: false
    t.bigint "assigned_by"
    t.datetime "assigned_at"
    t.text "admin_notes"
    t.text "cancellation_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["address_id"], name: "index_service_requests_on_address_id"
    t.index ["preferred_at"], name: "index_service_requests_on_preferred_at"
    t.index ["provider_id"], name: "index_service_requests_on_provider_id"
    t.index ["reference_number"], name: "index_service_requests_on_reference_number", unique: true
    t.index ["service_id"], name: "index_service_requests_on_service_id"
    t.index ["status"], name: "index_service_requests_on_status"
    t.index ["user_id", "status"], name: "index_service_requests_on_user_id_and_status"
    t.index ["user_id"], name: "index_service_requests_on_user_id"
  end

  create_table "services", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.string "name", null: false
    t.text "description"
    t.text "short_description"
    t.string "pricing_type", default: "quotation", null: false
    t.decimal "fixed_price", precision: 10, scale: 2
    t.string "image_url"
    t.integer "sort_order", default: 0
    t.boolean "active", default: true
    t.integer "estimated_duration_minutes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_services_on_active"
    t.index ["category_id", "active"], name: "index_services_on_category_id_and_active"
    t.index ["category_id"], name: "index_services_on_category_id"
    t.index ["pricing_type"], name: "index_services_on_pricing_type"
  end

  create_table "status_histories", force: :cascade do |t|
    t.string "entity_type", null: false
    t.bigint "entity_id", null: false
    t.string "previous_status"
    t.string "new_status", null: false
    t.bigint "changed_by"
    t.text "notes"
    t.datetime "created_at", null: false
    t.index ["entity_type", "entity_id"], name: "index_status_histories_on_entity_type_and_entity_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email"
    t.string "phone"
    t.string "password_digest"
    t.string "role", default: "customer", null: false
    t.string "status", default: "active", null: false
    t.boolean "phone_verified", default: false
    t.boolean "email_verified", default: false
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true, where: "(email IS NOT NULL)"
    t.index ["phone"], name: "index_users_on_phone", unique: true, where: "(phone IS NOT NULL)"
    t.index ["role"], name: "index_users_on_role"
    t.index ["status"], name: "index_users_on_status"
  end

  add_foreign_key "addresses", "users"
  add_foreign_key "admin_activity_logs", "users", column: "admin_user_id"
  add_foreign_key "bookings", "quotations"
  add_foreign_key "bookings", "service_requests"
  add_foreign_key "communications", "service_requests"
  add_foreign_key "communications", "users", column: "admin_user_id"
  add_foreign_key "device_tokens", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "payments", "bookings"
  add_foreign_key "payments", "users", column: "recorded_by"
  add_foreign_key "provider_services", "providers"
  add_foreign_key "provider_services", "services"
  add_foreign_key "quotations", "service_requests"
  add_foreign_key "quotations", "users", column: "created_by"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "request_attachments", "service_requests"
  add_foreign_key "service_requests", "addresses"
  add_foreign_key "service_requests", "providers"
  add_foreign_key "service_requests", "services"
  add_foreign_key "service_requests", "users"
  add_foreign_key "service_requests", "users", column: "assigned_by"
  add_foreign_key "services", "categories"
  add_foreign_key "status_histories", "users", column: "changed_by"
end
