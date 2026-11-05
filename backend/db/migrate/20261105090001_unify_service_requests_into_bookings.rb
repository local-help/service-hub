class UnifyServiceRequestsIntoBookings < ActiveRecord::Migration[8.0]
  def up
    # 1. Allow service_request_id to be nullable in bookings
    change_column_null :bookings, :service_request_id, true

    # 2. Add columns to bookings
    add_reference :bookings, :user, foreign_key: true
    add_reference :bookings, :service, foreign_key: true
    add_reference :bookings, :service_variant, foreign_key: true
    add_reference :bookings, :address, foreign_key: true
    add_reference :bookings, :provider, foreign_key: true
    add_column :bookings, :reference_number, :string
    add_column :bookings, :description, :text
    add_column :bookings, :preferred_at, :datetime
    add_column :bookings, :booking_type, :string
    add_column :bookings, :vehicle_type, :string
    add_column :bookings, :duration_hours, :integer
    add_column :bookings, :selected_options, :jsonb, default: {}
    add_column :bookings, :total_amount, :decimal, precision: 10, scale: 2
    add_column :bookings, :assigned_by, :bigint
    add_column :bookings, :assigned_at, :datetime

    add_index :bookings, :reference_number, unique: true

    # 3. Add booking_id to related tables
    add_reference :request_attachments, :booking, foreign_key: true
    add_reference :quotations, :booking, foreign_key: true
    add_reference :communications, :booking, foreign_key: true
    add_reference :provider_assignments, :booking, foreign_key: true

    # Allow service_request_id to be nullable in related tables
    change_column_null :request_attachments, :service_request_id, true
    change_column_null :quotations, :service_request_id, true
    change_column_null :communications, :service_request_id, true
    change_column_null :provider_assignments, :service_request_id, true

    # 4. Migrate existing data
    execute <<~SQL
      -- Populate existing bookings from their service_requests
      UPDATE bookings b
      SET
        user_id = sr.user_id,
        service_id = sr.service_id,
        service_variant_id = sr.service_variant_id,
        address_id = sr.address_id,
        provider_id = sr.provider_id,
        reference_number = sr.reference_number,
        description = sr.description,
        preferred_at = sr.preferred_at,
        booking_type = sr.booking_type,
        vehicle_type = sr.vehicle_type,
        duration_hours = sr.duration_hours,
        selected_options = sr.selected_options,
        assigned_by = sr.assigned_by,
        assigned_at = sr.assigned_at
      FROM service_requests sr
      WHERE b.service_request_id = sr.id;

      -- For service_requests that had NO booking, create a booking
      INSERT INTO bookings (
        service_request_id, user_id, service_id, service_variant_id, address_id, provider_id,
        reference_number, description, preferred_at, scheduled_at, status, booking_type,
        vehicle_type, duration_hours, selected_options, assigned_by, assigned_at,
        created_at, updated_at
      )
      SELECT
        sr.id, sr.user_id, sr.service_id, sr.service_variant_id, sr.address_id, sr.provider_id,
        sr.reference_number, sr.description, sr.preferred_at, sr.preferred_at, sr.status, sr.booking_type,
        sr.vehicle_type, sr.duration_hours, sr.selected_options, sr.assigned_by, sr.assigned_at,
        sr.created_at, sr.updated_at
      FROM service_requests sr
      WHERE sr.id NOT IN (SELECT service_request_id FROM bookings WHERE service_request_id IS NOT NULL);

      -- Link attachments to bookings
      UPDATE request_attachments ra
      SET booking_id = b.id
      FROM bookings b
      WHERE ra.service_request_id = b.service_request_id;

      -- Link quotations to bookings
      UPDATE quotations q
      SET booking_id = b.id
      FROM bookings b
      WHERE q.service_request_id = b.service_request_id;

      -- Link communications to bookings
      UPDATE communications c
      SET booking_id = b.id
      FROM bookings b
      WHERE c.service_request_id = b.service_request_id;

      -- Link provider_assignments to bookings
      UPDATE provider_assignments pa
      SET booking_id = b.id
      FROM bookings b
      WHERE pa.service_request_id = b.service_request_id;
    SQL
  end

  def down
    remove_reference :provider_assignments, :booking
    remove_reference :communications, :booking
    remove_reference :quotations, :booking
    remove_reference :request_attachments, :booking

    remove_column :bookings, :assigned_at
    remove_column :bookings, :assigned_by
    remove_column :bookings, :total_amount
    remove_column :bookings, :selected_options
    remove_column :bookings, :duration_hours
    remove_column :bookings, :vehicle_type
    remove_column :bookings, :booking_type
    remove_column :bookings, :preferred_at
    remove_column :bookings, :description
    remove_column :bookings, :reference_number
    remove_reference :bookings, :provider
    remove_reference :bookings, :address
    remove_reference :bookings, :service_variant
    remove_reference :bookings, :service
    remove_reference :bookings, :user
  end
end
