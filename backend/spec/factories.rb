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
    city { 'Bengaluru' }
    state { 'Karnataka' }
    postal_code { '560001' }
    latitude { 12.9716 }
    longitude { 77.5946 }
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
    email { Faker::Internet.email }
    city { 'Bengaluru' }
    service_area { 'Central Bengaluru' }
    active { true }
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
