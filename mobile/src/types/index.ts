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
}

export interface Address {
  id: number;
  label: string | null;
  address_line: string;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export type RequestStatus = 
  | 'submitted'
  | 'pending_review'
  | 'provider_contacted'
  | 'quotation_created'
  | 'quotation_sent'
  | 'customer_approved'
  | 'customer_rejected'
  | 'booking_confirmed'
  | 'cancelled';

export interface ServiceRequest {
  id: number;
  reference_number: string;
  status: RequestStatus;
  description: string;
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  service?: Service;
  address?: Address;
  quotation?: Quotation;
  booking?: Booking;
  created_at: string;
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
  service_request_id: number;
  reference_number: string;
  status: BookingStatus;
  scheduled_at?: string | null;
  completed_at?: string | null;
  rating?: number | null;
  feedback?: string | null;
  total_paid: number;
  payment_amount: number | null;
  fully_paid: boolean;
  service_name?: string;
  created_at: string;
}

export interface SupportInfo {
  phone: string;
  whatsapp: string;
  platform_name: string;
}

