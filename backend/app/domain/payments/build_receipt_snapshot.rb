# frozen_string_literal: true

module Payments
  class BuildReceiptSnapshot
    include Callable
    extend Dry::Initializer

    option :payment, type: Types::Instance(Payment)

    def call
      booking = payment.booking
      user = booking.user
      service = booking.service
      address = booking.address
      provider = booking.provider
      selected_opts = booking.selected_options || {}

      prefix = PlatformSetting.get('receipt_prefix', default: 'LOCAL')
      receipt_number = "#{prefix}-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.alphanumeric(6).upcase}"

      # Calculate breakdown
      pkg_name = selected_opts['package_name'] || booking.service_variant&.name || 'Standard Service'
      pkg_price = (selected_opts['package_price'] || booking.service_variant&.primary_price || service&.fixed_price || 0.0).to_f

      addons = Array(selected_opts['addons']).map do |add|
        {
          'id' => add['id'] || add[:id],
          'name' => add['name'] || add[:name],
          'price' => (add['price'] || add[:price] || 0.0).to_f
        }
      end
      addons_total = addons.sum { |a| a['price'] }

      builder_cfg = service&.builder_config || {}
      platform_fee = (builder_cfg['platform_fee'] || 0.0).to_f
      total_paid = payment.amount.to_f
      subtotal = pkg_price + addons_total
      total_bill = subtotal + platform_fee
      balance_due = [total_bill - total_paid, 0.0].max

      sched_time = booking.scheduled_at || booking.preferred_at || Time.current
      service_completion_str = sched_time.strftime('%d/%m/%Y, %I:%M %p')

      {
        'receipt_number' => receipt_number,
        'invoice_number' => receipt_number,
        'invoice_date' => Time.current.strftime('%d/%m/%Y'),
        'generated_at' => Time.current.iso8601,
        'document_type' => 'Invoice & Payment Receipt',
        'payment_status' => payment.paid? ? 'PAID' : 'DUE',
        'service_status' => (booking.status == 'completed' ? 'COMPLETED' : booking.status.humanize.upcase),
        'service_completion_time' => service_completion_str,
        'legal_disclaimer' => PlatformSetting.get(
          'receipt_disclaimer',
          default: "This is a reusable service invoice and payment receipt format. Issue it as a tax invoice only where legally applicable and after the supplier's legal name, address, GSTIN (if registered), applicable tax rate and statutory particulars have been verified. Do not show GST or collect tax unless applicable."
        ),
        'supplier' => {
          'name' => PlatformSetting.get('legal_entity_name', default: 'LocalHelp Technologies Private Limited'),
          'address' => PlatformSetting.get('business_address', default: '3rd Floor, Civil Lines Commercial Complex, MG Marg, Prayagraj, UP 211001'),
          'contact' => "#{PlatformSetting.get('support_phone', default: '+919876543210')} / #{PlatformSetting.get('support_email', default: 'care@localhelp.in')}",
          'phone' => PlatformSetting.get('support_phone', default: '+919876543210'),
          'email' => PlatformSetting.get('support_email', default: 'care@localhelp.in'),
          'gstin' => PlatformSetting.get('platform_gstin', default: '09AAACL1234F1Z5')
        },
        'platform' => {
          'name' => PlatformSetting.get('platform_name', default: 'LOCAL'),
          'legal_entity_name' => PlatformSetting.get('legal_entity_name', default: 'LocalHelp Technologies Private Limited'),
          'business_address' => PlatformSetting.get('business_address', default: '3rd Floor, Civil Lines Commercial Complex, MG Marg, Prayagraj, UP 211001'),
          'support_email' => PlatformSetting.get('support_email', default: 'care@localhelp.in'),
          'support_phone' => PlatformSetting.get('support_phone', default: '+919876543210'),
          'platform_gstin' => PlatformSetting.get('platform_gstin', default: '09AAACL1234F1Z5'),
          'city' => PlatformSetting.get('city', default: 'Prayagraj')
        },
        'customer' => {
          'id' => user&.id,
          'name' => user&.name || 'Valued Customer',
          'email' => user&.email,
          'phone' => user&.phone || 'N.A.',
          'address' => address&.full_address || address&.address_line || 'Civil Lines, Prayagraj',
          'billing_address' => {
            'label' => address&.label,
            'address_line' => address&.address_line,
            'landmark' => address&.landmark,
            'city' => address&.city || 'Prayagraj',
            'state' => address&.state || 'Uttar Pradesh',
            'postal_code' => address&.postal_code || '211001',
            'full_address' => address&.full_address
          }
        },
        'provider' => {
          'name' => provider&.name || 'Authorized LocalHelp Partner',
          'phone' => provider&.phone || PlatformSetting.get('support_phone', default: '+919876543210'),
          'provider_id' => provider ? "PRV-#{provider.id.to_s.rjust(4, '0')}" : 'LOCAL-P01',
          'area' => provider&.service_area || 'Prayagraj Central'
        },
        'booking' => {
          'id' => booking.id,
          'reference_number' => booking.reference_number,
          'booking_type' => booking.booking_type,
          'scheduled_at' => booking.scheduled_at&.iso8601 || booking.preferred_at&.iso8601,
          'service_location' => address&.full_address || address&.address_line || 'Doorstep Service, Prayagraj',
          'status' => booking.status
        },
        'service' => {
          'id' => service&.id,
          'name' => service&.name,
          'category' => service&.category&.name&.upcase || 'CAR CARE & ASSISTANCE',
          'package_name' => pkg_name,
          'vehicle_type' => booking.vehicle_type,
          'item_description' => [service&.name, pkg_name, booking.vehicle_type].compact.join(' - '),
          'addons' => addons,
          'provider_name' => provider&.name || 'Authorized LocalHelp Partner',
          'provider_phone' => provider&.phone || PlatformSetting.get('support_phone', default: '+919876543210'),
          'provider_area' => provider&.service_area || 'Prayagraj Central'
        },
        'payment' => {
          'id' => payment.id,
          'amount' => total_paid,
          'currency' => 'INR',
          'status' => payment.status,
          'method' => payment.method == 'online' ? 'UPI / Card / NetBanking' : 'Cash / Offline',
          'gateway' => payment.method == 'online' ? 'Razorpay Secure' : 'Direct Offline / Cash',
          'reference' => payment.gateway_reference || 'N.A.',
          'transaction_id' => payment.gateway_reference || "TXN-#{payment.id}-#{payment.created_at.to_i}",
          'order_id' => payment.gateway_order_id,
          'payment_date' => format_payment_date(payment),
          'metadata' => payment.gateway_metadata || {}
        },
        'breakdown' => {
          'subtotal' => subtotal,
          'base_amount' => pkg_price,
          'package_price' => pkg_price,
          'addons_total' => addons_total,
          'discount' => 0.0,
          'platform_fee' => platform_fee,
          'travel_charges' => platform_fee,
          'taxes_amount' => 0.0,
          'total_bill' => total_bill,
          'booking_payment' => total_paid,
          'final_payment_received' => total_paid,
          'total_amount' => total_paid,
          'balance_due' => balance_due,
          'currency' => 'INR'
        }
      }
    end

    private

    def format_payment_date(payment)
      raw = payment.gateway_metadata&.dig('verified_at') || payment.updated_at
      raw.to_datetime.iso8601
    rescue StandardError
      payment.updated_at.iso8601
    end
  end
end
