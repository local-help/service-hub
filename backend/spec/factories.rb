FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.unique.email }
    phone { "+91#{Faker::Number.unique.number(digits: 10)}" }
    password { 'Password@123' }
    role { 'customer' }
    status { 'active' }
    phone_verified { true }
    email_verified { true }

    trait :admin do
      role { 'admin' }
    end

    trait :super_admin do
      role { 'super_admin' }
    end

    trait :unverified do
      phone_verified { false }
      email_verified { false }
    end

    trait :inactive do
      status { 'inactive' }
    end
  end

  factory :address do
    user
    label { 'Home' }
    address_line { Faker::Address.street_address }
    landmark { Faker::Address.community }
    city { 'Prayagraj' }
    state { 'Uttar Pradesh' }
    postal_code { '211001' }
    latitude { 25.4519 }
    longitude { 81.8340 }
    is_default { false }
  end

  factory :category do
    name { Faker::Commerce.unique.department }
    description { Faker::Lorem.sentence }
    active { true }
  end

  factory :service do
    category
    name { Faker::Commerce.product_name }
    description { Faker::Lorem.paragraph }
    short_description { Faker::Lorem.sentence }
    pricing_type { 'fixed_price' }
    fixed_price { 499.00 }
    active { true }

    trait :quotation_based do
      pricing_type { 'quotation' }
      fixed_price { nil }
    end
  end

  factory :provider do
    name { Faker::Company.name }
    phone { "+91#{Faker::Number.unique.number(digits: 10)}" }
    email { Faker::Internet.unique.email }
    city { 'Prayagraj' }
    service_area { 'Civil Lines & Katra' }
    active { true }
    verification_status { 'verified' }
    operational_status { 'active' }
    onboarding_status { 'completed' }

    trait :suspended do
      verification_status { 'suspended' }
      operational_status { 'suspended' }
      active { false }
      suspended_at { Time.current }
      suspension_reason { 'Policy violation' }
    end
  end

  factory :provider_user do
    user
    provider
    role { 'owner' }
    active { true }
  end

  factory :provider_assignment do
    service_request
    provider
    assigned_by factory: [:user, :admin]
    assigned_at { Time.current }
    status { 'assigned' }
  end

  factory :service_request do
    user
    service
    address
    description { 'Water pipe is leaking heavily under the kitchen sink' }
    status { 'pending_review' }
  end

  factory :quotation do
    service_request
    creator factory: [:user, :admin]
    amount { 750.00 }
    description { 'Includes replacement of CPVC pipe and sealing joints' }
    valid_until { 3.days.from_now }
    status { 'pending' }
  end

  factory :booking do
    service_request
    user { service_request&.user || association(:user) }
    service { service_request&.service || association(:service) }
    address { service_request&.address || association(:address, user: user) }
    description { service_request&.description || 'Standard Booking Description' }
    scheduled_at { 1.day.from_now }
    status { 'confirmed' }
  end

  factory :payment do
    booking
    amount { 500.00 }
    add_attribute(:method) { 'online' }
    status { 'pending' }
  end
end
