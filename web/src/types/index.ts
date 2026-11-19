export type UserRole = 'customer' | 'admin' | 'super_admin' | 'provider';

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  phone_verified: boolean;
  email_verified: boolean;
  avatar_url?: string | null;
  provider_id?: number | null;
  provider_name?: string | null;
  provider_role?: 'owner' | 'manager' | 'staff' | null;
  has_password?: boolean;
  google_linked?: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  label: string | null;
  address_line: string;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  full_address: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  position: number;
  active: boolean;
  services_count?: number;
}

export interface ServicePricing {
  id: number;
  service_variant_id: number;
  price: number | null;
  pricing_type: string;
  applicable_conditions: Record<string, any>;
  active: boolean;
}

export interface ServiceVariant {
  id: number;
  service_id: number;
  name: string;
  description?: string;
  variant_attributes: Record<string, any>;
  position: number;
  active: boolean;
  primary_price: number | null;
  service_pricings?: ServicePricing[];
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description: string;
  image_url?: string | null;
  icon_name?: string | null;
  icon?: string | null;
  position?: number;
  active?: boolean;
  coming_soon?: boolean;
  services_count?: number;
  subcategories_count?: number;
  subcategories?: Subcategory[];
  services?: Service[];
  active_services?: Service[];
}

export interface ServiceAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
}

export interface BuilderStepOption {
  id: string;
  label: string;
  subtext?: string;
  icon?: string;
}

export interface BuilderStep {
  id: string;
  type: 'segmented_control' | 'radio' | 'select';
  title: string;
  subtitle?: string;
  required?: boolean;
  default_value?: string;
  options: BuilderStepOption[];
}

export interface BuilderPackage {
  id: string;
  name: string;
  short_description?: string;
  badge?: string;
  prices: Record<string, number>;
}

export interface BuilderConfig {
  steps?: BuilderStep[];
  packages?: BuilderPackage[];
  platform_fee?: number;
  guarantee_badge?: string;
}

export interface Service {
  id: number;
  category_id: number;
  subcategory_id?: number | null;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  pricing_type: 'fixed_price' | 'quotation';
  booking_type?: 'fixed_price' | 'quotation' | 'time_based';
  fixed_price: number | null;
  image_url?: string | null;
  estimated_duration_minutes?: number | null;
  position?: number;
  active?: boolean;
  coming_soon?: boolean;
  supported_vehicle_types?: string[];
  category?: Category;
  subcategory?: Subcategory;
  variants?: ServiceVariant[];
  builder_config?: BuilderConfig;
  addons?: ServiceAddon[];
}

export type RequestStatus =
  | 'submitted'
  | 'pending_review'
  | 'contacting_provider'
  | 'quotation_sent'
  | 'quotation_approved'
  | 'quotation_rejected'
  | 'customer_approved'
  | 'customer_rejected'
  | 'booking_confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceRequest {
  id: number;
  reference_number: string;
  status: RequestStatus;
  description: string;
  preferred_at?: string | null;
  user_id: number;
  customer_name: string;
  customer_phone: string;
  service_id: number;
  service_name: string;
  service_category: string;
  pricing_type: 'fixed_price' | 'quotation';
  fixed_price?: number | null;
  provider_id?: number | null;
  provider_name?: string | null;
  has_quotation: boolean;
  quotation_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired' | null;
  quotation_amount?: number | null;
  has_booking: boolean;
  booking_id?: number | null;
  booking_status?: string | null;
  created_at: string;
  assigned_by?: number | null;
  assigned_at?: string | null;
  admin_notes?: string | null;
  cancellation_reason?: string | null;
  user?: User;
  service?: Service;
  address?: Address;
  provider?: Provider;
  quotation?: Quotation;
  booking?: Booking;
  communications?: Communication[];
  request_attachments?: { id: number; file_url: string; file_name?: string; content_type?: string; file_size?: number }[];
}

export interface Quotation {
  id: number;
  service_request_id: number;
  amount: number;
  description?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  valid_until: string;
  is_expired?: boolean;
  created_by?: number;
  created_at: string;
}

export type BookingStatus =
  | 'pending_assignment'
  | 'specialist_assigned'
  | 'pending_review'
  | 'contacting_provider'
  | 'quotation_sent'
  | 'quotation_approved'
  | 'confirmed'
  | 'in_progress'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export type OrderStatus = BookingStatus;

export interface Booking {
  id: number;
  reference_number: string;
  status: BookingStatus;
  scheduled_at?: string | null;
  preferred_at?: string | null;
  description?: string;
  booking_type?: string;
  vehicle_type?: string;
  duration_hours?: number;
  selected_options?: Record<string, any>;
  total_paid: number;
  payment_amount: number | null;
  total_amount?: number | null;
  fully_paid: boolean;
  rating?: number | null;
  feedback?: string | null;
  cancellation_reason?: string | null;
  admin_notes?: string | null;
  service_id?: number;
  service_name?: string;
  service_category?: string;
  service_image_url?: string | null;
  pricing_type?: 'fixed_price' | 'quotation';
  fixed_price?: number | null;
  customer_name?: string;
  customer_phone?: string;
  provider_id?: number | null;
  provider_name?: string | null;
  has_quotation?: boolean;
  quotation_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired' | null;
  quotation_amount?: number | null;
  created_at: string;
  user?: User;
  service?: Service;
  service_variant?: ServiceVariant;
  address?: Address;
  provider?: Provider;
  quotation?: Quotation;
  payments?: Payment[];
  request_attachments?: { id: number; file_url: string; file_name?: string; content_type?: string; file_size?: number }[];
  communications?: Communication[];
  service_request_id?: number | null;
  service_request?: ServiceRequest;
}

export type Order = Booking;

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  method: 'online' | 'offline';
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  gateway_reference?: string | null;
  gateway_order_id?: string | null;
  recorded_by?: number | null;
  created_at: string;
}

export interface PaymentReceipt {
  id: number;
  payment_id: number;
  booking_id: number;
  receipt_number: string;
  status: 'issued' | 'voided';
  generated_at: string;
  emailed_at?: string | null;
  last_emailed_to?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  total_amount: number;
  payment_reference?: string | null;
  payment_method: string;
  customer_name?: string | null;
  service_name?: string | null;
  receipt_data: Record<string, any>;
  created_at: string;
}

export interface ProviderAvailability {
  id: number;
  provider_id: number;
  is_available: boolean;
  operating_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  temporary_unavailability_start?: string | null;
  temporary_unavailability_end?: string | null;
  unavailability_reason?: string | null;
  currently_available: boolean;
}

export interface ProviderAssignment {
  id: number;
  service_request_id: number;
  provider_id: number;
  assigned_by_id: number;
  status: 'assigned' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'reassigned';
  assigned_at: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  completed_at?: string | null;
  rejection_reason?: string | null;
  internal_notes?: string | null;
  provider_name?: string;
  service_request?: {
    id: number;
    reference_number: string;
    status: RequestStatus;
    description: string;
    preferred_at?: string | null;
    customer_name: string;
    customer_phone: string;
    service_id: number;
    service_name: string;
    service_category: string;
    service_variant_name?: string;
    pricing_type: 'fixed_price' | 'quotation';
    fixed_price?: number | null;
    address?: {
      id: number;
      label?: string | null;
      address_line?: string;
      landmark?: string | null;
      city?: string;
      state?: string;
      postal_code?: string;
      formatted?: string;
    };
    active_quotation?: {
      id: number;
      amount: number;
      description?: string | null;
      status: string;
      valid_until: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ProviderUser {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'staff';
  active: boolean;
  joined_at?: string;
}

export interface ProviderServiceItem {
  id: number;
  service_id: number;
  service_name: string;
  category_name: string;
  pricing_type: string;
  base_price?: number | null;
  active: boolean;
  provider_specific_pricing?: Record<string, any>;
  variants?: Array<{ id: number; name: string; vehicle_type?: string; price: number | null }>;
}

export interface Provider {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  phone: string;
  email?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  business_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  service_area?: string | null;
  notes?: string | null;
  active: boolean;
  verification_status?: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  operational_status?: 'active' | 'inactive' | 'suspended';
  onboarding_status?: 'pending' | 'under_review' | 'completed';
  approved_at?: string | null;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  availability?: ProviderAvailability;
  services?: Service[];
  created_at: string;
}

export interface Communication {
  id: number;
  service_request_id: number;
  admin_user_id: number;
  admin_name: string;
  channel: 'phone' | 'whatsapp';
  direction: 'inbound' | 'outbound';
  summary?: string | null;
  outcome?: string | null;
  communicated_at: string;
  created_at: string;
}

export interface SupportInfo {
  phone: string;
  whatsapp: string;
  platform_name: string;
}

export interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  updated_at: string;
}

export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  body: string | null;
  metadata?: {
    booking_id?: number;
    reference_number?: string;
    service_id?: number;
    provider_id?: number;
    quotation_id?: number;
    action_url?: string;
    amount?: number;
    old_status?: string;
    new_status?: string;
    [key: string]: any;
  };
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}

