# Seeds for LocalHelp V1

puts "== Seeding Platform Settings =="
PlatformSetting.set('support_phone', '+919876543210', value_type: 'string', description: 'Customer care phone number')
PlatformSetting.set('support_whatsapp', '+919876543210', value_type: 'string', description: 'Customer care WhatsApp number')
PlatformSetting.set('platform_name', 'LocalHelp', value_type: 'string', description: 'Platform brand name')
PlatformSetting.set('city', 'Prayagraj', value_type: 'string', description: 'Operating city')

puts "== Seeding Users =="
super_admin = User.find_or_create_by!(email: 'superadmin@localhelp.com') do |u|
  u.name = 'Super Admin'
  u.phone = '+919999900001'
  u.password = 'Admin@123456'
  u.role = 'super_admin'
  u.status = 'active'
  u.email_verified = true
  u.phone_verified = true
end

admin = User.find_or_create_by!(email: 'admin@localhelp.com') do |u|
  u.name = 'Operations Lead'
  u.phone = '+919999900002'
  u.password = 'Admin@123456'
  u.role = 'admin'
  u.status = 'active'
  u.email_verified = true
  u.phone_verified = true
end

customer = User.find_or_create_by!(email: 'customer@example.com') do |u|
  u.name = 'Rahul Sharma'
  u.phone = '+919888877771'
  u.password = 'Customer@123456'
  u.role = 'customer'
  u.status = 'active'
  u.email_verified = true
  u.phone_verified = true
end

Address.find_or_create_by!(user: customer, address_line: 'Flat 402, Triveni Heights, Civil Lines') do |a|
  a.label = 'Home'
  a.landmark = 'Near Subhash Chauraha'
  a.city = 'Prayagraj'
  a.state = 'Uttar Pradesh'
  a.postal_code = '211001'
  a.latitude = 25.4519
  a.longitude = 81.8340
  a.is_default = true
end

puts "== Seeding Categories & Services =="
categories_data = [
  {
    name: 'Car Cleaning & Maintenance',
    description: 'Professional doorstep car wash, interior detailing, and routine servicing',
    icon_name: 'car',
    sort_order: 1,
    services: [
      {
        name: 'Doorstep Eco Car Wash & Wax',
        description: 'Complete exterior foam wash, tire dressing, interior vacuuming and dashboard polish right at your doorstep.',
        short_description: 'Exterior foam wash & interior vacuum',
        pricing_type: 'fixed_price',
        fixed_price: 699.00,
        estimated_duration_minutes: 60,
        sort_order: 1
      },
      {
        name: 'Deep Interior Spa & Sanitization',
        description: 'Steam cleaning of seats, roof, floor mats, AC vent disinfection, and odor removal.',
        short_description: 'Complete seat and carpet steam cleaning',
        pricing_type: 'fixed_price',
        fixed_price: 1499.00,
        estimated_duration_minutes: 120,
        sort_order: 2
      },
      {
        name: 'Car Ceramic Coating & Scratch Removal',
        description: 'Multi-stage paint correction followed by 9H ceramic coating layer for long-lasting gloss and scratch resistance.',
        short_description: 'Paint correction and ceramic protection',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 240,
        sort_order: 3
      }
    ]
  },
  {
    name: 'Home Cleaning & Househelp',
    description: 'Thorough deep cleaning for apartments, villas, kitchens, and bathrooms',
    icon_name: 'sparkles',
    sort_order: 2,
    services: [
      {
        name: 'Complete Home Deep Cleaning (2 BHK)',
        description: 'Intense scrub and sanitization of 2 bedrooms, hall, kitchen, and 2 bathrooms using industrial equipment.',
        short_description: 'Full house deep cleaning for 2 BHK',
        pricing_type: 'fixed_price',
        fixed_price: 2999.00,
        estimated_duration_minutes: 240,
        sort_order: 1
      },
      {
        name: 'Intensive Bathroom Cleaning',
        description: 'Hard water stain removal from tiles, taps, mirrors, and deep sanitization of sanitary ware.',
        short_description: 'Tile descaling and deep disinfection',
        pricing_type: 'fixed_price',
        fixed_price: 499.00,
        estimated_duration_minutes: 60,
        sort_order: 2
      },
      {
        name: 'Post-Renovation / Move-in Cleaning',
        description: 'Debris clearing, paint splatter removal, high-dusting, and thorough deep washing before moving in.',
        short_description: 'Comprehensive clean for freshly painted/renovated homes',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 360,
        sort_order: 3
      }
    ]
  },
  {
    name: 'Plumbing Services',
    description: 'Expert pipe repairs, tap installations, leakages, and bathroom fittings',
    icon_name: 'wrench',
    sort_order: 3,
    services: [
      {
        name: 'Tap / Mixer Repair & Replacement',
        description: 'Inspection and fixing of leaky taps, cartridges, shower mixers, or new tap installation.',
        short_description: 'Fix dripping taps or install new fixtures',
        pricing_type: 'fixed_price',
        fixed_price: 249.00,
        estimated_duration_minutes: 45,
        sort_order: 1
      },
      {
        name: 'Drain Blockage Clearance',
        description: 'Mechanized clearing of clogged kitchen sinks, bathroom drains, or toilet pipes.',
        short_description: 'Fast clearance of clogged drains',
        pricing_type: 'fixed_price',
        fixed_price: 449.00,
        estimated_duration_minutes: 60,
        sort_order: 2
      },
      {
        name: 'Full Bathroom Repiping & Water Tank Overhaul',
        description: 'Complete copper or CPVC pipeline replacement, concealed leak detection, and rooftop tank maintenance.',
        short_description: 'Major plumbing overhauls and concealed leaks',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 300,
        sort_order: 3
      }
    ]
  },
  {
    name: 'Electrical Repairs',
    description: 'Certified electricians for switches, wiring, lighting, MCB, and inverter issues',
    icon_name: 'bolt',
    sort_order: 4,
    services: [
      {
        name: 'Switchboard / Socket Installation & Repair',
        description: 'Replacement or repair of modular switchboards, high-load AC sockets, and earthing checks.',
        short_description: 'Repair switches, sockets, and faceplates',
        pricing_type: 'fixed_price',
        fixed_price: 199.00,
        estimated_duration_minutes: 30,
        sort_order: 1
      },
      {
        name: 'Ceiling Fan Installation / Motor Repair',
        description: 'Assembly and mounting of ceiling fans, BLDC fans, or capacitor replacements.',
        short_description: 'Ceiling fan mounting and troubleshooting',
        pricing_type: 'fixed_price',
        fixed_price: 299.00,
        estimated_duration_minutes: 45,
        sort_order: 2
      },
      {
        name: 'Complete Home Rewiring & Inverter Setup',
        description: 'Comprehensive electrical cabling, phase balancing, circuit breaker panel upgrade, and backup inverter installation.',
        short_description: 'Whole-house electrical wiring & distribution',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 480,
        sort_order: 3
      }
    ]
  },
  {
    name: 'Appliance & Electronics Repairs',
    description: 'Repairs for air conditioners, refrigerators, washing machines, microwaves, and TVs',
    icon_name: 'tv',
    sort_order: 5,
    services: [
      {
        name: 'AC Jet Pump Service & Gas Check',
        description: 'High-pressure water cleaning of indoor and outdoor coils, filter cleaning, and refrigerant pressure check.',
        short_description: 'Deep foam coil wash and AC inspection',
        pricing_type: 'fixed_price',
        fixed_price: 599.00,
        estimated_duration_minutes: 60,
        sort_order: 1
      },
      {
        name: 'Refrigerator Not Cooling / Compressor Repair',
        description: 'Diagnosis and replacement of thermostat, relay, compressor motor, or cooling coil repairs.',
        short_description: 'Cooling diagnostic and component fix',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 90,
        sort_order: 2
      },
      {
        name: 'Washing Machine Drum & PCB Diagnostic',
        description: 'Testing of spin motor, electronic PCB, inlet valve, and water drainage issues.',
        short_description: 'Front & top load washing machine repair',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 90,
        sort_order: 3
      }
    ]
  },
  {
    name: 'Other Local Services',
    description: 'Carpentry, painting, pest control, and handyman assistance',
    icon_name: 'briefcase',
    sort_order: 6,
    services: [
      {
        name: 'General Handyman & Furniture Assembly (2 hours)',
        description: 'Drilling, picture hanging, curtain rod fixing, IKEA furniture assembly, door locks.',
        short_description: 'Minor carpentry and mounting tasks',
        pricing_type: 'fixed_price',
        fixed_price: 499.00,
        estimated_duration_minutes: 120,
        sort_order: 1
      },
      {
        name: 'Pest Control & Bedbug Extermination',
        description: 'Odourless herbal and chemical gel treatment for cockroaches, ants, termites, and bedbugs.',
        short_description: 'Whole home pest eradication',
        pricing_type: 'quotation',
        fixed_price: nil,
        estimated_duration_minutes: 120,
        sort_order: 2
      }
    ]
  }
]

categories_data.each do |cat_data|
  services = cat_data.delete(:services)
  category = Category.find_or_create_by!(name: cat_data[:name]) do |c|
    c.description = cat_data[:description]
    c.icon_name = cat_data[:icon_name]
    c.sort_order = cat_data[:sort_order]
    c.active = true
  end

  services.each do |svc_data|
    Service.find_or_create_by!(name: svc_data[:name], category: category) do |s|
      s.description = svc_data[:description]
      s.short_description = svc_data[:short_description]
      s.pricing_type = svc_data[:pricing_type]
      s.fixed_price = svc_data[:fixed_price]
      s.estimated_duration_minutes = svc_data[:estimated_duration_minutes]
      s.sort_order = svc_data[:sort_order]
      s.active = true
    end
  end
end

puts "== Seeding Providers Directory =="
providers_data = [
  {
    name: 'Apex Car Detailing & Wash',
    phone: '+919811122233',
    email: 'contact@apexwash.com',
    address: 'MG Marg, Civil Lines',
    city: 'Prayagraj',
    service_area: 'Civil Lines, Ashok Nagar, Georgetown',
    notes: 'Equipped with mobile water tanks and high-pressure steam washers. Highly reliable for doorstep jobs.',
    service_names: ['Doorstep Eco Car Wash & Wax', 'Deep Interior Spa & Sanitization', 'Car Ceramic Coating & Scratch Removal']
  },
  {
    name: 'SparklePro Cleaning Services',
    phone: '+919822233344',
    email: 'info@sparklepro.in',
    address: 'Tagore Town, Near Colonelganj',
    city: 'Prayagraj',
    service_area: 'Tagore Town, Katra, Mumfordganj',
    notes: 'Team of 8 trained cleaning professionals with commercial scrubbing machines.',
    service_names: ['Complete Home Deep Cleaning (2 BHK)', 'Intensive Bathroom Cleaning', 'Post-Renovation / Move-in Cleaning']
  },
  {
    name: 'MasterFlow Plumbers',
    phone: '+919833344455',
    email: 'support@masterflow.co',
    address: 'Katra Main Market',
    city: 'Prayagraj',
    service_area: 'Katra, Civil Lines, University Area',
    notes: 'Certified plumbers, 15+ years experience. Available for emergency blockages.',
    service_names: ['Tap / Mixer Repair & Replacement', 'Drain Blockage Clearance', 'Full Bathroom Repiping & Water Tank Overhaul']
  },
  {
    name: 'VoltCare Electrical Works',
    phone: '+919844455566',
    email: 'voltcare@gmail.com',
    address: 'Leader Road, Near Junction',
    city: 'Prayagraj',
    service_area: 'All Prayagraj & Naini',
    notes: 'Licensed wiremen for domestic and commercial electrical maintenance.',
    service_names: ['Switchboard / Socket Installation & Repair', 'Ceiling Fan Installation / Motor Repair', 'Complete Home Rewiring & Inverter Setup']
  },
  {
    name: 'QuickFix Appliance Clinic',
    phone: '+919855566677',
    email: 'quickfix.appliances@gmail.com',
    address: 'Ashok Nagar Chauraha',
    city: 'Prayagraj',
    service_area: 'Ashok Nagar, Civil Lines, Lukerganj',
    notes: 'Specializes in Daikin, LG, Samsung, Voltas split ACs and inverter refrigerators.',
    service_names: ['AC Jet Pump Service & Gas Check', 'Refrigerator Not Cooling / Compressor Repair', 'Washing Machine Drum & PCB Diagnostic']
  }
]

providers_data.each do |p_data|
  service_names = p_data.delete(:service_names)
  provider = Provider.find_or_create_by!(phone: p_data[:phone]) do |p|
    p.name = p_data[:name]
    p.email = p_data[:email]
    p.address = p_data[:address]
    p.city = p_data[:city]
    p.service_area = p_data[:service_area]
    p.notes = p_data[:notes]
    p.active = true
  end

  service_names.each do |s_name|
    svc = Service.find_by(name: s_name)
    if svc
      ProviderService.find_or_create_by!(provider: provider, service: svc)
    end
  end
end

puts "== Seed Data Completed Successfully! =="
puts "Created:"
puts "  - #{Category.count} Categories"
puts "  - #{Service.count} Services"
puts "  - #{Provider.count} Providers"
puts "  - #{User.count} Users (Super Admin, Admin, Customer)"
