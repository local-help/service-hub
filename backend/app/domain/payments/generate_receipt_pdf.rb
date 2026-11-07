# frozen_string_literal: true

require 'prawn'
require 'prawn/table'

Prawn::Fonts::AFM.hide_m17n_warning = true if defined?(Prawn::Fonts::AFM)

module Payments
  class GenerateReceiptPdf
    include Callable
    extend Dry::Initializer

    option :receipt_data

    PRIMARY_COLOR = '0F2F57' # Deep Navy Blue
    BORDER_COLOR  = '94A3B8' # Slate border
    BG_MUTED      = 'F8FAFC' # Light grey background
    BG_BLUE_BOX   = 'F0F7FF' # Customer & Provider light blue box
    BORDER_BLUE   = '93C5FD' # Soft blue border
    BG_YELLOW     = 'FEF9C3' # Soft yellow highlight for TOTAL BILL
    BG_BLUE_TOTAL = 'E0F2FE' # Soft light blue for TOTAL PAID / BALANCE DUE

    def call
      data = receipt_data.is_a?(String) ? JSON.parse(receipt_data) : receipt_data.deep_stringify_keys

      pdf = Prawn::Document.new(
        page_size: 'A4',
        margin: [28, 36, 26, 36],
        info: {
          Title: "LOCAL Invoice & Payment Receipt #{data['receipt_number'] || data['invoice_number']}",
          Author: data.dig('supplier', 'name') || data.dig('platform', 'legal_entity_name') || 'LOCAL',
          Subject: "Invoice & Payment Receipt for #{data.dig('booking', 'reference_number')}",
          Creator: 'LOCAL Centralized Payment Engine'
        }
      )

      render_header(pdf, data)
      render_supplier_details(pdf, data)
      render_invoice_details(pdf, data)
      render_customer_and_provider(pdf, data)
      render_charges_and_summary(pdf, data)
      render_tax_invoice_note(pdf, data)
      render_footer(pdf, data)

      pdf.render
    end

    private

    # ----------------------------------------------------
    # Header: Logo on left, "INVOICE & PAYMENT RECEIPT" on right
    # ----------------------------------------------------
    def render_header(pdf, data)
      logo_path = Rails.root.join('app', 'assets', 'images', 'local-logo.jpg').to_s

      pdf.float do
        if File.exist?(logo_path)
          pdf.image logo_path, width: 135
        else
          pdf.fill_color PRIMARY_COLOR
          pdf.font('Helvetica-Bold', size: 22) do
            pdf.text 'LOCAL'
          end
          pdf.fill_color 'F59E0B'
          pdf.font('Helvetica-Bold', size: 9) do
            pdf.text 'Happy to Help'
          end
        end
      end

      pdf.bounding_box([pdf.bounds.width - 270, pdf.cursor], width: 270) do
        pdf.fill_color PRIMARY_COLOR
        pdf.font('Helvetica-Bold', size: 14) do
          pdf.text 'INVOICE & PAYMENT RECEIPT', align: :right
        end
        pdf.move_down 2
        pdf.font('Helvetica', size: 8.5) do
          pdf.text 'LOCAL — Happy To Help', align: :right, color: PRIMARY_COLOR
        end
      end

      pdf.move_down 18
    end

    # ----------------------------------------------------
    # 1. SERVICE / SUPPLIER DETAILS
    # ----------------------------------------------------
    def render_supplier_details(pdf, data)
      supplier = data['supplier'] || data['platform'] || {}

      render_section_heading(pdf, 'SERVICE / SUPPLIER DETAILS')

      supplier_table_data = [
        [
          "Supplier / Business Name: #{supplier['name'] || supplier['legal_entity_name'] || 'LocalHelp Technologies Private Limited'}",
          "Business Address: #{supplier['address'] || supplier['business_address'] || '3rd Floor, Civil Lines, Prayagraj, UP 211001'}"
        ],
        [
          "Phone / Email: #{supplier['contact'] || [supplier['phone'] || supplier['support_phone'], supplier['email'] || supplier['support_email']].compact.join(' / ')}",
          "GSTIN: #{supplier['gstin'] || supplier['platform_gstin'] || 'Enter only if applicable'}"
        ]
      ]

      pdf.table(supplier_table_data, width: pdf.bounds.width) do |t|
        t.cells.padding = [4, 6, 4, 6]
        t.cells.size = 7.5
        t.cells.border_width = 0.5
        t.cells.border_color = BORDER_COLOR
        t.cells.background_color = BG_MUTED
        t.cells.text_color = '1E293B'
      end

      pdf.move_down 8
    end

    # ----------------------------------------------------
    # 2. INVOICE DETAILS (3x3 grid)
    # ----------------------------------------------------
    def render_invoice_details(pdf, data)
      booking = data['booking'] || {}
      payment = data['payment'] || {}
      service = data['service'] || {}

      inv_number  = data['invoice_number'] || data['receipt_number'] || "LOCAL-#{booking['reference_number']}"
      inv_date    = data['invoice_date'] || (DateTime.parse(data['generated_at']).strftime('%d/%m/%Y') rescue Time.current.strftime('%d/%m/%Y'))
      pay_status  = data['payment_status'] || (payment['status'].to_s.upcase == 'PAID' ? 'PAID' : 'DUE')

      category    = service['category'] || 'CAR CARE & ASSISTANCE'
      item_desc   = service['item_description'] || [service['name'], service['package_name'], service['vehicle_type']].compact.join(' - ')
      svc_status  = data['service_status'] || 'COMPLETED'

      pay_method  = payment['method'].to_s.upcase.presence || 'UPI / ONLINE GATEWAY'
      pay_ref     = payment['reference'] || payment['transaction_id'] || 'N.A.'
      booking_ref = booking['reference_number'] || "# #{booking['id']}"

      render_section_heading(pdf, 'INVOICE DETAILS')

      invoice_table_data = [
        [
          "Invoice Number\n[#{inv_number}]",
          "Invoice Date\n[#{inv_date}]",
          "Payment Status\n[#{pay_status}]"
        ],
        [
          "Service Category\n[#{category}]",
          "Service / Item\n[#{item_desc}]",
          "Service Status\n[#{svc_status}]"
        ],
        [
          "Payment Method\n[#{pay_method}]",
          "Payment Reference\n[#{pay_ref}]",
          "Booking / Job ID\n[#{booking_ref}]"
        ]
      ]

      col_w = pdf.bounds.width / 3.0

      pdf.table(invoice_table_data, width: pdf.bounds.width, column_widths: [col_w, col_w, col_w]) do |t|
        t.cells.padding = [4, 6, 4, 6]
        t.cells.size = 7.5
        t.cells.border_width = 0.5
        t.cells.border_color = BORDER_COLOR
        t.cells.text_color = '1E293B'
      end

      pdf.move_down 8
    end

    # ----------------------------------------------------
    # 3. CUSTOMER & SERVICE PROVIDER
    # ----------------------------------------------------
    def render_customer_and_provider(pdf, data)
      customer = data['customer'] || {}
      provider = data['provider'] || data['service'] || {}
      booking  = data['booking'] || {}

      render_section_heading(pdf, 'CUSTOMER & SERVICE PROVIDER')

      cust_name    = customer['name'] || 'Customer'
      cust_phone   = customer['phone'] || 'N.A.'
      cust_addr    = customer['address'] || customer.dig('billing_address', 'full_address') || customer.dig('billing_address', 'address_line') || customer['email'] || 'Doorstep Delivery'

      prov_name    = provider['name'] || provider['provider_name'] || 'Authorized LocalHelp Partner'
      prov_phone   = provider['phone'] || provider['provider_phone'] || '+91 98765 43210'
      prov_id      = provider['provider_id'] || "PRV-#{booking['id'] || '01'}"

      svc_loc      = booking['service_location'] || cust_addr
      completion_t = data['service_completion_time'] || (DateTime.parse(booking['scheduled_at']).strftime('%d/%m/%Y, %I:%M %p') rescue Time.current.strftime('%d/%m/%Y, 10:00 AM'))

      col_half = pdf.bounds.width / 2.0

      parties_table_data = [
        [
          "CUSTOMER\nName: #{cust_name}\nPhone: #{cust_phone}\nEmail / Address: #{customer['email'] || cust_addr}",
          "SERVICE PROVIDER\nName / Business: #{prov_name}\nPhone: #{prov_phone}\nProvider ID: #{prov_id}"
        ],
        [
          {
            content: "Service Location: [#{svc_loc}]    Service Completion Date & Time: [#{completion_t}]",
            colspan: 2
          }
        ]
      ]

      pdf.table(parties_table_data, width: pdf.bounds.width, column_widths: [col_half, col_half]) do |t|
        t.cells.padding = [4, 6, 4, 6]
        t.cells.size = 7.5
        t.cells.border_width = 0.5
        t.cells.border_color = BORDER_BLUE
        t.cells.background_color = BG_BLUE_BOX
        t.cells.text_color = '1E293B'
      end

      pdf.move_down 8
    end

    # ----------------------------------------------------
    # 4. CHARGES & PAYMENT SUMMARY
    # ----------------------------------------------------
    def render_charges_and_summary(pdf, data)
      breakdown = data['breakdown'] || {}
      service   = data['service'] || {}
      payment   = data['payment'] || {}
      addons    = service['addons'] || []

      render_section_heading(pdf, 'CHARGES & PAYMENT SUMMARY')

      table_data = [
        [
          { content: 'Description of Service / Item', font_style: :bold },
          { content: 'Qty.', font_style: :bold, align: :center },
          { content: 'Rate (Rs.)', font_style: :bold, align: :right },
          { content: 'Amount (Rs.)', font_style: :bold, align: :right }
        ]
      ]

      # 1. Base Package Row
      pkg_name  = service['package_name'] || 'Selected Service Package'
      svc_title = service['name'] || 'Doorstep Service'
      item_name = service['vehicle_type'].present? ? "#{pkg_name} (#{service['vehicle_type']}) - #{svc_title}" : "#{pkg_name} - #{svc_title}"
      pkg_price = (breakdown['package_price'] || breakdown['base_amount'] || 0.0).to_f

      table_data << [
        item_name,
        '1',
        format_amount(pkg_price),
        format_amount(pkg_price)
      ]

      # 2. Add-on Rows
      addons.each do |addon|
        addon_price = (addon['price'] || 0.0).to_f
        table_data << [
          "Add-on: #{addon['name']}",
          '1',
          format_amount(addon_price),
          format_amount(addon_price)
        ]
      end

      subtotal        = (breakdown['subtotal'] || (pkg_price + addons.sum { |a| (a['price'] || 0).to_f })).to_f
      discount        = (breakdown['discount'] || 0.0).to_f
      travel_charges  = (breakdown['travel_charges'] || breakdown['platform_fee'] || 0.0).to_f
      taxes           = (breakdown['taxes_amount'] || 0.0).to_f
      total_bill      = (breakdown['total_bill'] || (subtotal - discount + travel_charges + taxes)).to_f
      booking_pay     = (breakdown['booking_payment'] || payment['amount'] || total_bill).to_f
      final_received  = (breakdown['final_payment_received'] || booking_pay).to_f
      balance_due     = (breakdown['balance_due'] || [total_bill - final_received, 0.0].max).to_f

      # Summary Rows
      table_data << [
        { content: 'Subtotal', colspan: 3, align: :left },
        { content: "Rs. #{format_amount(subtotal)}", align: :right }
      ]

      table_data << [
        { content: 'Discount (if any)', colspan: 3, align: :left },
        { content: "Rs. #{format_amount(discount)}", align: :right }
      ]

      table_data << [
        { content: 'Travel / Convenience / Other Charges', colspan: 3, align: :left },
        { content: "Rs. #{format_amount(travel_charges)}", align: :right }
      ]

      table_data << [
        { content: 'Tax (only if applicable; show breakup separately)', colspan: 3, align: :left },
        { content: taxes > 0 ? "Rs. #{format_amount(taxes)}" : 'Rs. 0.00', align: :right }
      ]

      # TOTAL BILL (Yellow highlight)
      table_data << [
        { content: 'TOTAL BILL', colspan: 3, font_style: :bold, align: :left, background_color: BG_YELLOW },
        { content: "Rs. #{format_amount(total_bill)}", font_style: :bold, align: :right, background_color: BG_YELLOW }
      ]

      table_data << [
        { content: 'Booking Payment', colspan: 3, align: :left },
        { content: "Rs. #{format_amount(booking_pay)}", align: :right }
      ]

      table_data << [
        { content: 'Final Payment Received', colspan: 3, align: :left },
        { content: "Rs. #{format_amount(final_received)}", align: :right }
      ]

      # TOTAL PAID / BALANCE DUE (Blue highlight)
      table_data << [
        { content: 'TOTAL PAID / BALANCE DUE', colspan: 3, font_style: :bold, align: :left, background_color: BG_BLUE_TOTAL, text_color: PRIMARY_COLOR },
        { content: "Rs. #{format_amount(final_received)} / Rs. #{format_amount(balance_due)}", font_style: :bold, align: :right, background_color: BG_BLUE_TOTAL, text_color: PRIMARY_COLOR }
      ]

      desc_w = pdf.bounds.width * 0.50
      qty_w  = pdf.bounds.width * 0.09
      rate_w = pdf.bounds.width * 0.17
      amt_w  = pdf.bounds.width * 0.24

      pdf.table(table_data, width: pdf.bounds.width, column_widths: [desc_w, qty_w, rate_w, amt_w]) do |t|
        t.cells.padding = [3.5, 6, 3.5, 6]
        t.cells.size = 7.5
        t.cells.border_width = 0.5
        t.cells.border_color = BORDER_COLOR

        # Header styling
        t.row(0).background_color = PRIMARY_COLOR
        t.row(0).text_color = 'FFFFFF'
        t.row(0).size = 7.5

        # Normal item rows
        t.row(1).text_color = '1E293B'
      end

      pdf.move_down 8
    end

    # ----------------------------------------------------
    # 5. TAX / INVOICE NOTE & SIGNATURES
    # ----------------------------------------------------
    def render_tax_invoice_note(pdf, data)
      render_section_heading(pdf, 'TAX / INVOICE NOTE')

      note_text = data['legal_disclaimer'] ||
                  "This is a reusable service invoice and payment receipt format. Issue it as a tax invoice only where legally applicable and after the supplier's legal name, address, GSTIN (if registered), applicable tax rate and statutory particulars have been verified. Do not show GST or collect tax unless applicable."

      pdf.fill_color '475569'
      pdf.font('Helvetica', size: 6.8) do
        pdf.text note_text, leading: 2
      end

      pdf.move_down 14

      # Signatures line
      pdf.font('Helvetica-Bold', size: 7.5) do
        pdf.fill_color '334155'
        pdf.float do
          pdf.text 'Customer Acknowledgement: [Name / Signature, optional]'
        end
        pdf.text 'Authorized Signatory: [Name / Signature]', align: :right
      end

      pdf.move_down 14
    end

    # ----------------------------------------------------
    # Footer
    # ----------------------------------------------------
    def render_footer(pdf, _data)
      pdf.fill_color PRIMARY_COLOR
      pdf.font('Helvetica-Bold', size: 8) do
        pdf.text 'LOCAL — Happy To Help  |  Thank you for choosing LOCAL.', align: :center
      end
    end

    # ----------------------------------------------------
    # Helpers
    # ----------------------------------------------------
    def render_section_heading(pdf, text)
      pdf.fill_color PRIMARY_COLOR
      pdf.font('Helvetica-Bold', size: 8.5) do
        pdf.text text
      end
      pdf.move_down 2.5
    end

    def format_amount(val)
      sprintf('%.2f', val.to_f)
    end
  end
end
