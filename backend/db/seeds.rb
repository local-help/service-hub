# Seeds for LocalHelp V1 - Complete Service Catalogue

puts "== Seeding Platform Settings =="
PlatformSetting.set('support_phone', '+919876543210', value_type: 'string', description: 'Customer care phone number')
PlatformSetting.set('support_whatsapp', '+919876543210', value_type: 'string', description: 'Customer care WhatsApp number')
PlatformSetting.set('support_email', 'care@localhelp.in', value_type: 'string', description: 'Customer care email address')
PlatformSetting.set('platform_name', 'LocalHelp', value_type: 'string', description: 'Platform brand name')
PlatformSetting.set('legal_entity_name', 'LocalHelp Technologies Private Limited', value_type: 'string', description: 'Registered business legal entity name')
PlatformSetting.set('business_address', '3rd Floor, Civil Lines Commercial Complex, MG Marg, Prayagraj, UP 211001', value_type: 'string', description: 'Registered business address')
PlatformSetting.set('platform_gstin', '09AAACL1234F1Z5', value_type: 'string', description: 'Platform GSTIN (if applicable)')
PlatformSetting.set('receipt_prefix', 'LOCAL', value_type: 'string', description: 'Unique receipt number prefix')
PlatformSetting.set('receipt_disclaimer', "This is a reusable service invoice and payment receipt format. Issue it as a tax invoice only where legally applicable and after the supplier's legal name, address, GSTIN (if registered), applicable tax rate and statutory particulars have been verified. Do not show GST or collect tax unless applicable.", value_type: 'string', description: 'Legal document classification disclaimer')
PlatformSetting.set('city', 'Prayagraj', value_type: 'string', description: 'Operating city')

puts "== Seeding Users =="
User.find_or_create_by!(email: 'superadmin@localhelp.in') do |u|
  u.name = 'Super Admin'
  u.phone = '+919999900001'
  u.password = 'Admin@123456'
  u.role = 'super_admin'
  u.status = 'active'
  u.email_verified = true
  u.phone_verified = true
end

User.find_or_create_by!(email: 'admin@localhelp.in') do |u|
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

puts "== Seeding Service Catalogue =="

catalogue_data = [
  # ========================================================
  # A. VEHICLE SERVICES
  # ========================================================
  {
    name: 'Vehicle Services',
    slug: 'vehicle-services',
    description: 'Doorstep car wash, servicing, detailing, driver on demand, and roadside assistance.',
    icon: 'car',
    icon_name: 'car',
    position: 1,
    active: true,
    coming_soon: false,
    subcategories: [
      {
        name: 'Car Services',
        slug: 'car-services',
        description: 'Comprehensive doorstep car care from washing to detailing.',
        position: 1,
        services: [
          {
            name: 'Car Wash',
            slug: 'car-wash',
            description: 'Doorstep pressure wash and deep cleaning packages for hatchbacks, sedans, and SUVs.',
            short_description: 'Doorstep pressure foam wash and interior cleaning.',
            booking_type: 'fixed_price',
            fixed_price: 299.00,
            position: 1,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv'],
            variants: [
              # Hatchback / Sedan Packages
              {
                name: 'Complete Car Wash (Exterior + Interior) - Hatchback / Sedan',
                description: 'Full exterior foam wash, tire dressing, interior vacuuming and dashboard wipe.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'complete_wash' },
                price: 499.00
              },
              {
                name: 'Exterior Wash Without Body Polish - Hatchback / Sedan',
                description: 'Quick exterior pressure foam wash and wheel rinse.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'exterior_wash' },
                price: 299.00
              },
              {
                name: 'Exterior Wash With Body Polish - Hatchback / Sedan',
                description: 'Exterior foam wash plus machine liquid carnauba wax polish.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'exterior_polish' },
                price: 399.00
              },
              {
                name: 'Interior Cleaning - Hatchback / Sedan',
                description: 'Vacuuming, upholstery surface wipe, floor mat wash, and glass cleaning.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'interior_clean' },
                price: 349.00
              },
              {
                name: 'Interior Deep Cleaning Without Seat Removal - Hatchback / Sedan',
                description: 'Deep foam shampooing of roof, seats, carpet, and boot without unbolting seats.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'interior_deep_no_removal' },
                price: 799.00
              },
              {
                name: 'Interior Deep Cleaning With Seat Removal / Refitting - Hatchback / Sedan',
                description: 'Complete unbolting of seats for intensive extraction of deep floor dirt and stains.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'interior_deep_with_removal' },
                price: 1299.00
              },
              {
                name: 'Rubbing & Detailing — Basic - Hatchback / Sedan',
                description: 'Compound rubbing to remove swirl marks and minor clear-coat scratches.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'rubbing_basic' },
                price: 1499.00
              },
              {
                name: 'Rubbing & Detailing — Premium - Hatchback / Sedan',
                description: '3-stage paint restoration with rubbing, polishing, and synthetic paint sealant.',
                attributes: { vehicle_types: ['hatchback', 'sedan'], package_type: 'rubbing_premium' },
                price: 2499.00
              },
              # SUV / Big Car Packages
              {
                name: 'Complete Car Wash (Exterior + Interior) - SUV / Big Car',
                description: 'Full exterior foam wash, tire dressing, interior vacuuming and dashboard wipe for large vehicles.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'complete_wash' },
                price: 599.00
              },
              {
                name: 'Exterior Wash Without Body Polish - SUV / Big Car',
                description: 'Exterior pressure wash and wheel clean for SUVs.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'exterior_wash' },
                price: 349.00
              },
              {
                name: 'Exterior Wash With Body Polish - SUV / Big Car',
                description: 'Pressure foam wash plus hand polish application for SUVs.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'exterior_polish' },
                price: 449.00
              },
              {
                name: 'Interior Cleaning - SUV / Big Car',
                description: 'Complete interior vacuuming, dashboard and trunk conditioning for 6/7 seaters.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'interior_clean' },
                price: 399.00
              },
              {
                name: 'Interior Deep Cleaning Without Seat Removal - SUV / Big Car',
                description: 'Intensive stain extraction and steam sanitization for 3-row SUVs without seat removal.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'interior_deep_no_removal' },
                price: 999.00
              },
              {
                name: 'Interior Deep Cleaning With Seat Removal / Refitting - SUV / Big Car',
                description: 'Full disassembly and extraction of 7 seats and trunk carpeting.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'interior_deep_with_removal' },
                price: 1599.00
              },
              {
                name: 'Rubbing & Detailing — Basic - SUV / Big Car',
                description: 'Full body compound rubbing for SUVs.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'rubbing_basic' },
                price: 1899.00
              },
              {
                name: 'Rubbing & Detailing — Premium - SUV / Big Car',
                description: '3-stage restoration and ceramic glaze protection for large SUVs.',
                attributes: { vehicle_types: ['suv_muv'], package_type: 'rubbing_premium' },
                price: 2999.00
              }
            ]
          },
          {
            name: 'Car Servicing & Maintenance',
            slug: 'car-servicing-maintenance',
            description: 'Comprehensive mechanical checkup, engine oil replacement, filter cleaning, and brake checks.',
            short_description: 'Engine oil, filter service, brake inspection and multi-point checkup.',
            booking_type: 'fixed_price',
            position: 2,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
          },
          {
            name: 'Car Detailing',
            slug: 'car-detailing',
            description: 'Ceramic coating, paint protection films (PPF), and advanced exterior paint correction.',
            short_description: 'Ceramic paint protection and scratch correction.',
            booking_type: 'fixed_price',
            position: 3,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
          },
          {
            name: 'Car Essentials at Your Doorstep',
            slug: 'car-essentials',
            description: 'Wiper blades replacement, coolant top-up, windshield washer fluid, and air filter installation.',
            short_description: 'Doorstep delivery and fitment of car consumable essentials.',
            booking_type: 'fixed_price',
            fixed_price: 399.00,
            position: 4,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
          },
          {
            name: 'Car Insurance Assistance',
            slug: 'car-insurance-assistance',
            description: 'Expert guidance on claim estimation, cashless claims coordination, and policy renewals.',
            short_description: 'Insurance claims assistance and surveyor coordination.',
            booking_type: 'fixed_price',
            position: 5,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
          }
        ]
      },
      {
        name: 'Bike Services',
        slug: 'bike-services',
        description: 'Doorstep bike care, general service, puncture, and repairs.',
        position: 2,
        services: [
          {
            name: 'Bike Repair',
            slug: 'bike-repair',
            description: 'Diagnosis and repair for engine starting troubles, clutch cables, brakes, and electricals.',
            short_description: 'Two-wheeler mechanical and electrical diagnosis and repairs.',
            booking_type: 'fixed_price',
            position: 1,
            supported_vehicle_types: ['bike_scooter']
          },
          {
            name: 'Bike Maintenance',
            slug: 'bike-maintenance',
            description: 'General periodic maintenance: oil change, chain lube, spark plug clean, and brake adjustment.',
            short_description: 'Periodic service with chain lubrication and multi-point check.',
            booking_type: 'fixed_price',
            fixed_price: 499.00,
            position: 2,
            supported_vehicle_types: ['bike_scooter']
          },
          {
            name: 'Bike Wash',
            slug: 'bike-wash',
            description: 'Pressure foam wash, engine de-greasing, chain cleaning, and spray polish.',
            short_description: 'Doorstep high-pressure foam wash and gloss shine polish.',
            booking_type: 'fixed_price',
            fixed_price: 199.00,
            position: 3,
            supported_vehicle_types: ['bike_scooter']
          },
          {
            name: 'Bike Essentials',
            slug: 'bike-essentials',
            description: 'Engine oil top-up, mirror replacement, brake shoe fitment, and battery health test.',
            short_description: 'Quick consumable changes and cable replacements at your doorstep.',
            booking_type: 'fixed_price',
            fixed_price: 299.00,
            position: 4,
            supported_vehicle_types: ['bike_scooter']
          }
        ]
      },
      {
        name: 'Roadside Assistance',
        slug: 'roadside-assistance',
        description: 'Emergency assistance when stuck on the road. Admin will coordinate a prompt quotation based on location.',
        position: 3,
        services: [
          {
            name: 'Battery Jump Start',
            slug: 'battery-jump-start',
            description: 'Fast doorstep or roadside technician dispatch with heavy-duty jump leads / portable booster.',
            short_description: 'Quick on-spot battery jump start for cars and bikes.',
            booking_type: 'fixed_price',
            position: 1,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv', 'bike_scooter']
          },
          {
            name: 'Flat Tyre / Puncture Assistance',
            slug: 'puncture-assistance',
            description: 'Tubeless puncture repair or spare tyre stepney change at your current spot.',
            short_description: 'Tyre puncture fixing or stepney tyre change.',
            booking_type: 'fixed_price',
            position: 2,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv', 'bike_scooter']
          },
          {
            name: 'Fuel Delivery',
            slug: 'fuel-delivery',
            description: 'Emergency petrol or diesel delivered in safe compliant fuel canisters directly to your stranded vehicle.',
            short_description: 'Emergency 3-5 litres fuel delivered on the spot.',
            booking_type: 'fixed_price',
            position: 3,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv', 'bike_scooter']
          },
          {
            name: 'Key Lockout Assistance',
            slug: 'key-lockout',
            description: 'Specialized non-destructive unlocking service for keys locked inside the car cabin or boot.',
            short_description: 'Safe non-destructive car door lock opening.',
            booking_type: 'fixed_price',
            position: 4,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv']
          },
          {
            name: 'Towing Assistance',
            slug: 'towing-assistance',
            description: 'Flatbed or hydraulic crane towing truck coordination based on vehicle breakdown location and distance.',
            short_description: 'Safe flatbed or wheel-lift towing to your preferred workshop.',
            booking_type: 'fixed_price',
            position: 5,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv', 'bike_scooter']
          },
          {
            name: 'Mechanical Assistance',
            slug: 'mechanical-assistance',
            description: 'On-spot technician evaluation for overheating, alternator failure, or clutch breakdown.',
            short_description: 'Spot emergency troubleshooting and minor roadside fixes.',
            booking_type: 'fixed_price',
            position: 6,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv', 'bike_scooter']
          }
        ]
      },
      {
        name: 'Driver Services',
        slug: 'driver-services',
        description: 'Verified professional chauffeurs for city travel, full-day shifts, night driving, and outstation trips.',
        position: 4,
        services: [
          {
            name: 'Hourly Driver',
            slug: 'hourly-driver',
            description: 'Professional driver on demand with transparent time-based billing.',
            short_description: 'Driver on demand billed per hour.',
            booking_type: 'time_based',
            position: 1,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv'],
            variants: [
              {
                name: 'Standard Driver Booking',
                description: '₹800 for first 8 hours. ₹50/extra hr up to 10 PM. After 10 PM: ₹100/hr + ₹300 fixed night charge.',
                attributes: { type: 'standard' },
                price: 800.00,
                pricing_conditions: {
                  base_hours: 8,
                  base_price: 800.0,
                  additional_hour_rate: 50.0,
                  night_start_hour: 22,
                  night_additional_hour_rate: 100.0,
                  night_fixed_charge: 300.0
                }
              }
            ]
          },
          {
            name: 'Full-day Driver',
            slug: 'full-day-driver',
            description: 'Dedicated 8-hour chauffeur for local errands, meetings, or family functions.',
            short_description: '8-hour full day chauffeur shift.',
            booking_type: 'time_based',
            position: 2,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv'],
            variants: [
              {
                name: 'Full Day 8-Hour Shift',
                description: '₹800 for 8 hours (extra hours @ ₹50/hr).',
                attributes: { type: 'full_day' },
                price: 800.00,
                pricing_conditions: {
                  base_hours: 8,
                  base_price: 800.0,
                  additional_hour_rate: 50.0,
                  night_start_hour: 22,
                  night_additional_hour_rate: 100.0,
                  night_fixed_charge: 300.0
                }
              }
            ]
          },
          {
            name: 'Outstation Driver',
            slug: 'outstation-driver',
            description: 'Experienced highway drivers for intercity round trips and multi-day tours.',
            short_description: 'Highway experienced driver for inter-city travel.',
            booking_type: 'time_based',
            position: 3,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv'],
            variants: [
              {
                name: 'Outstation Daily Duty',
                description: 'Base daily rate + food & overnight allowance.',
                attributes: { type: 'outstation' },
                price: 1200.00,
                pricing_conditions: {
                  base_hours: 12,
                  base_price: 1200.0,
                  additional_hour_rate: 75.0,
                  night_start_hour: 22,
                  night_additional_hour_rate: 100.0,
                  night_fixed_charge: 300.0
                }
              }
            ]
          },
          {
            name: 'Night Driver',
            slug: 'night-driver',
            description: 'Safe designated chauffeur for late evening parties, club visits, or airport pickups.',
            short_description: 'Safe late-night driver with standard night allowance.',
            booking_type: 'time_based',
            position: 4,
            supported_vehicle_types: ['hatchback', 'sedan', 'suv_muv'],
            variants: [
              {
                name: 'Late Night Shift',
                description: 'Base 8 hrs + night allowance.',
                attributes: { type: 'night' },
                price: 1100.00,
                pricing_conditions: {
                  base_hours: 8,
                  base_price: 800.0,
                  additional_hour_rate: 100.0,
                  night_start_hour: 22,
                  night_additional_hour_rate: 100.0,
                  night_fixed_charge: 300.0
                }
              }
            ]
          }
        ]
      }
    ]
  },

  # ========================================================
  # B. HOME SERVICES
  # ========================================================
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Expert domestic maintenance: AC installations, electrical, plumbing, appliance fixes, and deep cleaning.',
    icon: 'home',
    icon_name: 'home',
    position: 2,
    active: true,
    coming_soon: false,
    subcategories: [
      {
        name: 'AC Services',
        slug: 'ac-services',
        description: 'Installation, jet pump deep servicing, and gas charging for all AC brands.',
        position: 1,
        services: [
          {
            name: 'Window AC Installation',
            slug: 'window-ac-installation',
            description: 'Complete mounting, wooden frame/bracket alignment, and cooling test.',
            short_description: 'Professional window AC mounting and sealing.',
            booking_type: 'fixed_price',
            fixed_price: 799.00,
            position: 1
          },
          {
            name: 'Split AC Installation',
            slug: 'split-ac-installation',
            description: 'Indoor bracket mounting, outdoor unit bracket fixing, copper pipe flare connection and vacuuming.',
            short_description: 'Indoor & outdoor unit installation with copper piping setup.',
            booking_type: 'fixed_price',
            fixed_price: 1299.00,
            position: 2
          },
          {
            name: 'AC Repair and Servicing',
            slug: 'ac-repair-servicing',
            description: 'High-pressure jet pump coil wash, PCB diagnostics, gas leak repair, and capacitor replacement.',
            short_description: 'Jet pump deep foam cleaning and gas/cooling troubleshooting.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      },
      {
        name: 'Electrical Services',
        slug: 'electrical-services',
        description: 'Licensed wiremen for domestic fixes, new points, and short-circuit investigations.',
        position: 2,
        services: [
          {
            name: 'Electrical Repair',
            slug: 'electrical-repair',
            description: 'Fixing tripped MCBs, burnt sockets, light fixture sparking, or phase outages.',
            short_description: 'Troubleshooting tripped breakers, burnt sockets, and faults.',
            booking_type: 'fixed_price',
            position: 1
          },
          {
            name: 'Electrical Installation',
            slug: 'electrical-installation',
            description: 'New concealed wiring, decorative chandelier hanging, distribution box upgrades.',
            short_description: 'New light points, ceiling fans, and distribution board fittings.',
            booking_type: 'fixed_price',
            position: 2
          },
          {
            name: 'Other Electrical Work',
            slug: 'other-electrical-work',
            description: 'Heavy appliance lines, 3-phase balancing, grounding / earthing pit inspection.',
            short_description: 'Custom domestic or small commercial wiring projects.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      },
      {
        name: 'Plumbing Services',
        slug: 'plumbing-services',
        description: 'Certified plumbers for leakages, drain blockages, mixer repairs, and motor pipelines.',
        position: 3,
        services: [
          {
            name: 'Plumbing Repair',
            slug: 'plumbing-repair',
            description: 'Fixing dripping taps, concealed pipe seepages, flush tank leakage, and low water pressure.',
            short_description: 'Tap mixer repairs, leak fixes, and flush tank overhaul.',
            booking_type: 'fixed_price',
            position: 1
          },
          {
            name: 'Plumbing Installation',
            slug: 'plumbing-installation',
            description: 'Fitting new washbasins, western commodes, water heater connections, and shower sets.',
            short_description: 'Sanitaryware, sink, and CP fitting installations.',
            booking_type: 'fixed_price',
            position: 2
          },
          {
            name: 'Other Plumbing Work',
            slug: 'other-plumbing-work',
            description: 'Overhead water tank cleaning, pressure booster pump setup, and main drain clearing.',
            short_description: 'Main pipeline repairs and water tank cleaning.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      },
      {
        name: 'Home Appliances',
        slug: 'home-appliances',
        description: 'Expert repair & service for everyday domestic electronics and kitchen machines.',
        position: 4,
        services: [
          { name: 'Geyser', slug: 'geyser-repair', description: 'Heating coil replacement, thermostat repair, water leak fix.', short_description: 'Water heater coil, thermostat, and valve repair.', booking_type: 'fixed_price', position: 1 },
          { name: 'RO Purifier', slug: 'ro-purifier-service', description: 'Filter candle replacement, membrane change, TDS check.', short_description: 'Sediment, carbon, and RO membrane replacement.', booking_type: 'fixed_price', position: 2 },
          { name: 'Refrigerator', slug: 'refrigerator-repair', description: 'Gas refill, inverter compressor diagnostics, frost buildup fix.', short_description: 'Cooling, thermostat, and compressor repairs.', booking_type: 'fixed_price', position: 3 },
          { name: 'Washing Machine', slug: 'washing-machine-repair', description: 'Drum vibration, drain pump block, error code clearance.', short_description: 'Top/front load drum, motor, and PCB repair.', booking_type: 'fixed_price', position: 4 },
          { name: 'BLDC Fan', slug: 'bldc-fan-service', description: 'BLDC remote pairing, PCB driver replacement, silent operation tuning.', short_description: 'BLDC fan remote and driver repair.', booking_type: 'fixed_price', position: 5 },
          { name: 'Mixer Grinder', slug: 'mixer-grinder-repair', description: 'Blade coupling replacement, jar bushing, motor carbon brush.', short_description: 'Mixer motor and coupler repairs.', booking_type: 'fixed_price', position: 6 },
          { name: 'Microwave & OTG', slug: 'microwave-otg-repair', description: 'Magnetron replacement, turntable motor, touch panel fix.', short_description: 'Heating magnetron, fuse, and turntable fixes.', booking_type: 'fixed_price', position: 7 },
          { name: 'Chimney', slug: 'chimney-cleaning-service', description: 'Deep oil degreasing, baffle filter scrub, suction motor service.', short_description: 'Chimney degreasing and suction service.', booking_type: 'fixed_price', position: 8 },
          { name: 'Oil Heater & Blower', slug: 'oil-heater-blower-repair', description: 'Heating rod element change, thermal cut-off sensor, fan servicing.', short_description: 'Room heater element and blower repairs.', booking_type: 'fixed_price', position: 9 },
          { name: 'Iron / Press', slug: 'iron-press-repair', description: 'Thermostat calibration, steam valve descaling, cord replacement.', short_description: 'Steam and dry iron repairs.', booking_type: 'fixed_price', position: 10 },
          { name: 'Air Cooler', slug: 'air-cooler-repair', description: 'Honeybee pad replacement, submersible pump check, motor rewinding.', short_description: 'Cooler pump, pads, and fan repairs.', booking_type: 'fixed_price', position: 11 },
          { name: 'LED Light', slug: 'led-light-installation', description: 'Panel light fixture driver change, cove lighting, strip LED setup.', short_description: 'False ceiling LED fixture repair.', booking_type: 'fixed_price', position: 12 },
          { name: 'Inverter', slug: 'inverter-battery-service', description: 'Battery gravity test, distilled water top-up, inverter charging card repair.', short_description: 'Inverter motherboard and battery maintenance.', booking_type: 'fixed_price', position: 13 }
        ]
      },
      {
        name: 'Home Cleaning',
        slug: 'home-cleaning',
        description: 'Professional hygiene team with industrial vacuums and eco-friendly disinfectants.',
        position: 5,
        services: [
          {
            name: 'General Home Cleaning',
            slug: 'general-home-cleaning',
            description: 'Dry dusting, floor mopping, cobweb removal, and surface sanitation.',
            short_description: 'Standard domestic dust and floor sanitation.',
            booking_type: 'fixed_price',
            fixed_price: 999.00,
            position: 1
          },
          {
            name: 'Deep Cleaning',
            slug: 'deep-cleaning',
            description: 'Machine scrubbing of tile grout, bathroom descaling, balcony wash, and window track cleaning.',
            short_description: 'Intensive mechanized scrub and descaling.',
            booking_type: 'fixed_price',
            fixed_price: 1899.00,
            position: 2
          }
        ]
      }
    ]
  },

  # ========================================================
  # C. COMPUTER SERVICES
  # ========================================================
  {
    name: 'Computer Services',
    slug: 'computer-services',
    description: 'Hardware diagnostics, OS installations, setup, and software troubleshooting at your doorstep.',
    icon: 'laptop',
    icon_name: 'laptop',
    position: 3,
    active: true,
    coming_soon: false,
    subcategories: [
      {
        name: 'Laptop Services',
        slug: 'laptop-services',
        description: 'Screen replacement, battery, thermal paste application, and hinge fixes.',
        position: 1,
        services: [
          {
            name: 'Laptop Repair',
            slug: 'laptop-repair',
            description: 'Motherboard chip-level diagnostics, broken screen repair, keyboard replacement.',
            short_description: 'Screen, keyboard, and motherboard repairs.',
            booking_type: 'fixed_price',
            position: 1
          },
          {
            name: 'Laptop Installation and Setup',
            slug: 'laptop-installation-setup',
            description: 'Unboxing new laptop, disk partitioning, security configurations, and printer pairing.',
            short_description: 'New device initial setup and data migration.',
            booking_type: 'fixed_price',
            fixed_price: 499.00,
            position: 2
          },
          {
            name: 'Laptop Hardware Upgrade',
            slug: 'laptop-hardware-upgrade',
            description: 'High-speed NVMe SSD addition, RAM expansion, and thermal paste re-application.',
            short_description: 'SSD speed upgrade and RAM expansion.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      },
      {
        name: 'Desktop Services',
        slug: 'desktop-services',
        description: 'Custom desktop PC assembling, SMPS power unit repair, and hardware optimization.',
        position: 2,
        services: [
          {
            name: 'Desktop Repair',
            slug: 'desktop-repair',
            description: 'Blue Screen of Death (BSOD), SMPS power supply failure, display graphics issues.',
            short_description: 'PC power, display, and booting diagnostics.',
            booking_type: 'fixed_price',
            position: 1
          },
          {
            name: 'Desktop Installation and Setup',
            slug: 'desktop-installation-setup',
            description: 'Dual-monitor setup, workstation cabling, uninterruptible power supply (UPS) wiring.',
            short_description: 'Desktop workstation installation and peripheral setup.',
            booking_type: 'fixed_price',
            fixed_price: 499.00,
            position: 2
          },
          {
            name: 'Desktop Hardware Upgrade',
            slug: 'desktop-hardware-upgrade',
            description: 'Graphics card (GPU) fitment, liquid cooling CPU radiator, and power supply swap.',
            short_description: 'Graphics card, CPU cooler, and storage upgrades.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      },
      {
        name: 'Software Services',
        slug: 'software-services',
        description: 'Operating system reinstallation, virus removal, driver updates, and software licensing.',
        position: 3,
        services: [
          {
            name: 'Software Installation',
            slug: 'software-installation',
            description: 'Installation of office productivity suites, accounting software, or design tools.',
            short_description: 'Standard desktop software and utility installation.',
            booking_type: 'fixed_price',
            fixed_price: 349.00,
            position: 1
          },
          {
            name: 'Operating System Installation',
            slug: 'os-installation',
            description: 'Clean Windows 11 / Linux installation, official updates, and all device motherboard drivers.',
            short_description: 'Genuine OS installation with full driver setup.',
            booking_type: 'fixed_price',
            fixed_price: 699.00,
            position: 2
          },
          {
            name: 'Troubleshooting',
            slug: 'software-troubleshooting',
            description: 'Deep malware removal, slow boot optimization, browser adware cleaning, and network connectivity.',
            short_description: 'Adware removal, boot speedup, and error troubleshooting.',
            booking_type: 'fixed_price',
            position: 3
          }
        ]
      }
    ]
  },

  # ========================================================
  # D. EMERGENCY ASSISTANCE (Coming Soon - Non Bookable)
  # ========================================================
  {
    name: 'Emergency Assistance',
    slug: 'emergency-assistance',
    description: 'Rapid response emergency coordination. Coming soon to Prayagraj.',
    icon: 'ambulance',
    icon_name: 'ambulance',
    position: 4,
    active: true,
    coming_soon: true,
    subcategories: [
      {
        name: 'Emergency Medical',
        slug: 'emergency-medical',
        description: 'Ambulance dispatch and critical patient transfer coordination.',
        position: 1,
        services: [
          {
            name: 'Ambulance Assistance',
            slug: 'ambulance-assistance',
            description: 'Emergency patient transport coordination with local hospitals and private fleet providers.',
            short_description: '24/7 basic and ICU ambulance dispatch (Coming Soon).',
            booking_type: 'fixed_price',
            coming_soon: true,
            position: 1
          }
        ]
      }
    ]
  }
]

catalogue_data.each do |cat_data|
  subcats_data = cat_data.delete(:subcategories) || []
  category = Category.find_or_initialize_by(slug: cat_data[:slug])
  category.assign_attributes(cat_data)
  category.save!

  subcats_data.each do |subcat_data|
    services_data = subcat_data.delete(:services) || []
    subcategory = category.subcategories.find_or_initialize_by(slug: subcat_data[:slug])
    subcategory.assign_attributes(subcat_data)
    subcategory.save!

    services_data.each do |svc_data|
      variants_data = svc_data.delete(:variants) || []
      service = subcategory.services.find_or_initialize_by(slug: svc_data[:slug])
      service.assign_attributes(svc_data.merge(category: category))
      service.save(validate: false)

      variants_data.each_with_index do |v_data, v_idx|
        pricing_conditions = v_data.delete(:pricing_conditions)
        price_val = v_data.delete(:price)

        variant = service.variants.find_or_initialize_by(name: v_data[:name])
        variant.assign_attributes(
          description: v_data[:description],
          variant_attributes: v_data[:attributes] || v_data[:variant_attributes] || {},
          position: v_idx + 1,
          active: true
        )
        variant.save!

        if price_val.present? || pricing_conditions.present?
          pricing = variant.service_pricings.find_or_initialize_by(active: true)
          pricing.assign_attributes(
            price: price_val || pricing_conditions&.dig(:base_price),
            pricing_type: service.booking_type_time_based? ? 'time_based' : 'fixed',
            applicable_conditions: pricing_conditions || {}
          )
          pricing.save!
        end
      end

      service.save! if variants_data.present?
    end
  end
end

puts "== Seeding Providers =="
providers_data = [
  {
    name: 'Apex Car Detailing & Wash',
    business_name: 'Apex Car Detailing & Wash',
    phone: '+919811122233',
    email: 'contact@apexwash.com',
    contact_person: 'Rajesh Sharma',
    contact_phone: '+919811122233',
    contact_email: 'apex_provider@localhelp.in',
    address: 'MG Marg, Civil Lines',
    business_address: 'Plot 14, MG Marg, Civil Lines, Prayagraj',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211001',
    service_area: 'Civil Lines, Ashok Nagar, Georgetown',
    notes: 'Equipped with mobile water tanks and high-pressure steam washers. Highly reliable for doorstep jobs.',
    verification_status: 'verified',
    operational_status: 'active',
    onboarding_status: 'completed',
    user_email: 'apex_provider@localhelp.in',
    user_name: 'Rajesh Sharma',
    service_slugs: ['car-wash', 'car-servicing-maintenance', 'car-detailing']
  },
  {
    name: 'SparklePro Cleaning Services',
    business_name: 'SparklePro Cleaning Services',
    phone: '+919822233344',
    email: 'info@sparklepro.in',
    contact_person: 'Pooja Verma',
    contact_phone: '+919822233344',
    contact_email: 'sparkle_provider@localhelp.in',
    address: 'Tagore Town, Near Colonelganj',
    business_address: '52/3 Tagore Town, Near Colonelganj, Prayagraj',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211002',
    service_area: 'Tagore Town, Katra, Mumfordganj',
    notes: 'Team of 8 trained cleaning professionals with commercial scrubbing machines.',
    verification_status: 'verified',
    operational_status: 'active',
    onboarding_status: 'completed',
    user_email: 'sparkle_provider@localhelp.in',
    user_name: 'Pooja Verma',
    service_slugs: ['general-home-cleaning', 'deep-cleaning']
  },
  {
    name: 'MasterFlow Plumbers',
    business_name: 'MasterFlow Plumbers',
    phone: '+919833344455',
    email: 'support@masterflow.co',
    contact_person: 'Ramesh Patel',
    contact_phone: '+919833344455',
    contact_email: 'support@masterflow.co',
    address: 'Katra Main Market',
    business_address: '12 Katra Main Market, Prayagraj',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211002',
    service_area: 'Katra, Civil Lines, University Area',
    notes: 'Certified plumbers, 15+ years experience. Available for emergency blockages.',
    verification_status: 'verified',
    operational_status: 'active',
    onboarding_status: 'completed',
    service_slugs: ['plumbing-repair', 'plumbing-installation', 'other-plumbing-work']
  },
  {
    name: 'VoltCare Electrical Works',
    business_name: 'VoltCare Electrical Works',
    phone: '+919844455566',
    email: 'voltcare@gmail.com',
    contact_person: 'Anil Kumar',
    contact_phone: '+919844455566',
    contact_email: 'voltcare@gmail.com',
    address: 'Leader Road, Near Junction',
    business_address: 'Leader Road, Near Junction, Prayagraj',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211003',
    service_area: 'All Prayagraj & Naini',
    notes: 'Licensed wiremen for domestic and commercial electrical maintenance.',
    verification_status: 'under_review',
    operational_status: 'active',
    onboarding_status: 'under_review',
    service_slugs: ['electrical-repair', 'electrical-installation', 'other-electrical-work']
  },
  {
    name: 'QuickFix Appliance Clinic',
    business_name: 'QuickFix Appliance Clinic',
    phone: '+919855566677',
    email: 'quickfix.appliances@gmail.com',
    contact_person: 'Suresh Gupta',
    contact_phone: '+919855566677',
    contact_email: 'quickfix.appliances@gmail.com',
    address: 'Ashok Nagar Chauraha',
    business_address: 'Ashok Nagar Chauraha, Prayagraj',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    postal_code: '211001',
    service_area: 'Ashok Nagar, Civil Lines, Lukerganj',
    notes: 'Specializes in Daikin, LG, Samsung, Voltas split ACs and inverter refrigerators.',
    verification_status: 'pending',
    operational_status: 'inactive',
    onboarding_status: 'pending',
    service_slugs: ['split-ac-installation', 'window-ac-installation', 'ac-repair-servicing']
  }
]

super_admin = User.find_by(role: :super_admin)

providers_data.each do |p_data|
  slugs = p_data.delete(:service_slugs)
  user_email = p_data.delete(:user_email)
  user_name = p_data.delete(:user_name)

  provider = Provider.find_or_initialize_by(phone: p_data[:phone])
  provider.assign_attributes(p_data.merge(active: p_data[:operational_status] == 'active'))
  provider.approved_by = super_admin if provider.verification_status == 'verified'
  provider.approved_at = Time.current if provider.verification_status == 'verified'
  provider.save!

  # Provider Availability
  ProviderAvailability.find_or_create_by!(provider: provider) do |avail|
    avail.is_available = provider.operational_active?
    avail.operating_days = %w[monday tuesday wednesday thursday friday saturday sunday]
    avail.working_hours_start = '08:00'
    avail.working_hours_end = '20:00'
  end

  slugs&.each do |s_slug|
    svc = Service.find_by(slug: s_slug)
    if svc
      ps = ProviderService.find_or_initialize_by(provider: provider, service: svc)
      ps.active = true
      ps.save!
    end
  end

  if user_email.present?
    prov_user = User.find_or_create_by!(email: user_email) do |u|
      u.name = user_name
      u.phone = p_data[:contact_phone]
      u.role = 'provider'
      u.password = 'Provider@123456'
      u.status = 'active'
      u.email_verified = true
      u.phone_verified = true
    end

    pu = ProviderUser.find_or_initialize_by(provider: provider, user: prov_user)
    pu.role = 'owner'
    pu.active = true
    pu.save!
  end
end

puts "== Seeding Sample Requests and Assignments =="
customer = User.find_by(role: :customer) || User.first
cust_address = customer.addresses.first || customer.addresses.create!(
  label: 'Home',
  address_type: 'home',
  line1: '12 Tagore Town, Near Colonelganj',
  city: 'Prayagraj',
  state: 'Uttar Pradesh',
  postal_code: '211002',
  is_default: true
)

car_wash_svc = Service.find_by(slug: 'car-wash') || Service.first
hatchback_var = car_wash_svc.service_variants.first
apex_prov = Provider.find_by(phone: '+919811122233')

if car_wash_svc && apex_prov && super_admin
  # Request 1: Assigned to Apex Specialist, Confirmed Fixed Price Booking
  sr1 = ServiceRequest.find_or_create_by!(reference_number: 'LH-10101') do |r|
    r.user = customer
    r.service = car_wash_svc
    r.service_variant = hatchback_var
    r.address = cust_address
    r.description = 'Complete Car Wash with interior vacuum and body polish'
    r.status = 'booking_confirmed'
    r.preferred_at = 1.day.from_now
  end

  b1 = Booking.find_or_create_by!(reference_number: 'BK-10101') do |b|
    b.user = customer
    b.service_request = sr1
    b.service = car_wash_svc
    b.service_variant = hatchback_var
    b.address = cust_address
    b.description = sr1.description
    b.preferred_at = sr1.preferred_at
    b.scheduled_at = sr1.preferred_at
    b.status = 'confirmed'
    b.provider = apex_prov
    b.assigned_by = super_admin.id
    b.assigned_at = Time.current
    b.booking_type = 'direct'
    b.total_amount = hatchback_var&.price || 499.00
  end

  ProviderAssignment.find_or_create_by!(service_request: sr1, provider: apex_prov) do |a|
    a.booking = b1
    a.assigned_by = super_admin
    a.assigned_at = Time.current
    a.status = 'assigned'
    a.internal_notes = 'High priority customer in Civil Lines'
  end

  # Request 2: Unassigned Confirmed Fixed Price Booking
  sr2 = ServiceRequest.find_or_create_by!(reference_number: 'LH-10102') do |r|
    r.user = customer
    r.service = car_wash_svc
    r.service_variant = hatchback_var
    r.address = cust_address
    r.description = 'Doorstep express car wash required before weekend'
    r.status = 'booking_confirmed'
    r.preferred_at = 2.days.from_now
  end

  Booking.find_or_create_by!(reference_number: 'BK-10102') do |b|
    b.user = customer
    b.service_request = sr2
    b.service = car_wash_svc
    b.service_variant = hatchback_var
    b.address = cust_address
    b.description = sr2.description
    b.preferred_at = sr2.preferred_at
    b.scheduled_at = sr2.preferred_at
    b.status = 'confirmed'
    b.booking_type = 'direct'
    b.total_amount = hatchback_var&.price || 499.00
  end

  # Auto-heal any existing service requests in database that lack a booking record
  ServiceRequest.where.missing(:booking).find_each do |orphan|
    ref = orphan.reference_number.sub(/\ALH-/, 'BK-')
    orphan.create_booking!(
      user: orphan.user,
      service: orphan.service,
      service_variant: orphan.service_variant,
      address: orphan.address,
      description: orphan.description.presence || 'Fixed Price Doorstep Service',
      preferred_at: orphan.preferred_at,
      scheduled_at: orphan.preferred_at || 1.day.from_now,
      status: 'confirmed',
      booking_type: 'direct',
      provider: orphan.provider,
      assigned_by: orphan.assigned_by,
      assigned_at: orphan.assigned_at,
      total_amount: orphan.service_variant&.price || orphan.service&.fixed_price || 499.00,
      reference_number: ref
    )
    orphan.update_columns(status: 'booking_confirmed')
  end
end

puts "== Seed summary =="
puts "Categories: #{Category.count}"
puts "Subcategories: #{Subcategory.count}"
puts "Services: #{Service.count}"
puts "Variants: #{ServiceVariant.count}"
puts "Service Pricing entries: #{ServicePricing.count}"
puts "Providers: #{Provider.count}"
puts "Provider Users: #{ProviderUser.count}"
puts "== Seeding Complete! =="
