export type UserRole = 'customer' | 'provider' | 'admin' | 'super_admin';

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
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  active: boolean;
  display_order?: number;
  coming_soon?: boolean;
  services_count?: number;
  subcategories_count?: number;
  subcategories?: Subcategory[];
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

export interface ServiceVariant {
  id: number;
  service_id: number;
  name: string;
  description?: string;
  variant_attributes: Record<string, any>;
  position: number;
  active: boolean;
  primary_price: number | null;
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
  slug: string;
  description?: string | null;
  short_description?: string;
  pricing_model?: 'fixed' | 'quotation';
  pricing_type?: 'fixed_price' | 'quotation';
  booking_type?: 'fixed_price' | 'quotation' | 'time_based';
  base_price?: number | null;
  fixed_price?: number | null;
  estimated_duration_minutes?: number | null;
  active: boolean;
  coming_soon?: boolean;
  supported_vehicle_types?: string[];
  category_name?: string;
  category?: Category;
  subcategory?: Subcategory;
  variants?: ServiceVariant[];
  builder_config?: BuilderConfig;
  addons?: ServiceAddon[];
}

export interface Address {
  id: number;
  label?: string | null;
  address_line: string;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  full_address?: string;
}

export interface Attachment {
  id?: number;
  file_url: string;
  file_name?: string | null;
  content_type?: string | null;
  file_size?: number | null;
}

export interface Provider {
  id: number;
  name: string;
  business_name?: string;
  description?: string | null;
  business_address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  verified?: boolean;
  verification_status?: 'pending' | 'verified' | 'rejected';
  operational_status?: 'active' | 'inactive' | 'suspended';
  rating?: number | null;
  jobs_completed?: number;
}

export interface ProviderAssignment {
  id: number;
  provider_id: number;
  provider_name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'reassigned' | 'completed';
  assigned_at?: string | null;
  accepted_at?: string | null;
  internal_notes?: string | null;
}

export type RequestStatus = 
  | 'submitted'
  | 'pending_review'
  | 'contacting_provider'
  | 'provider_contacted'
  | 'quotation_created'
  | 'quotation_sent'
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
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  vehicle_type?: string | null;
  duration_hours?: number | null;
  selected_options?: Record<string, any>;
  service?: Service;
  service_variant?: ServiceVariant | null;
  address?: Address;
  provider?: Provider | null;
  current_assignment?: ProviderAssignment | null;
  quotation?: Quotation | null;
  booking?: Booking | null;
  booking_status?: string | null;
  request_attachments?: Attachment[];
  created_at: string;
  // Admin-specific flat fields
  customer_name?: string;
  customer_phone?: string;
  service_name?: string;
  service_category?: string;
  provider_name?: string;
  has_quotation?: boolean;
  quotation_amount?: number | null;
  has_booking?: boolean;
}

export interface AdminDashboardData {
  metrics: {
    total_requests: number;
    pending_review: number;
    contacting_provider: number;
    awaiting_quotation: number;
    quotation_sent: number;
    quotation_approved: number;
    confirmed_bookings: number;
    in_progress_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    active_providers: number;
    total_customers: number;
  };
  recent_requests: ServiceRequest[];
}

export interface Quotation {
  id: number;
  service_request_id: number;
  reference_number: string;
  amount: number;
  valid_until?: string | null;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  description?: string | null;
  scope_of_work?: string | null;
  terms?: string | null;
  created_at: string;
}

export type BookingStatus =
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface Booking {
  id: number;
  service_request_id?: number | null;
  reference_number: string;
  status: BookingStatus;
  booking_type?: 'fixed_price' | 'quotation' | 'time_based';
  scheduled_at?: string | null;
  preferred_at?: string | null;
  completed_at?: string | null;
  description?: string | null;
  vehicle_type?: string | null;
  duration_hours?: number | null;
  selected_options?: Record<string, any>;
  rating?: number | null;
  feedback?: string | null;
  total_paid: number;
  payment_amount?: number | null;
  total_amount?: number | null;
  fully_paid: boolean;
  service?: Service;
  service_name?: string;
  service_variant?: ServiceVariant | null;
  address?: Address;
  provider?: Provider | null;
  current_assignment?: ProviderAssignment | null;
  quotation?: Quotation | null;
  request_attachments?: Attachment[];
  created_at: string;
}

export interface SupportInfo {
  phone: string;
  whatsapp: string;
  platform_name: string;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  read_at?: string | null;
  is_read: boolean;
  created_at: string;
}
