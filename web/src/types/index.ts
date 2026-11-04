export type UserRole = 'customer' | 'admin' | 'super_admin';

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
  active_services?: Service[];
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
}

export type RequestStatus =
  | 'pending_review'
  | 'contacting_provider'
  | 'quotation_sent'
  | 'quotation_approved'
  | 'quotation_rejected'
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
  quotation_status?: 'pending' | 'approved' | 'rejected' | 'expired' | null;
  quotation_amount?: number | null;
  has_booking: boolean;
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

export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

export interface Booking {
  id: number;
  service_request_id: number;
  quotation_id?: number | null;
  scheduled_at: string;
  status: BookingStatus;
  rating?: number | null;
  feedback?: string | null;
  cancellation_reason?: string | null;
  admin_notes?: string | null;
  total_paid: number;
  payment_amount: number | null;
  fully_paid: boolean;
  service_name?: string;
  reference_number?: string;
  created_at: string;
  service_request?: ServiceRequest;
  quotation?: Quotation;
  payments?: Payment[];
}

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

export interface Provider {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  service_area?: string | null;
  notes?: string | null;
  active: boolean;
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

