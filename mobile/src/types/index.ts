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
  display_order: number;
  services_count?: number;
}

export interface Service {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  pricing_model: 'fixed' | 'quotation';
  base_price?: number | null;
  estimated_duration_minutes?: number | null;
  active: boolean;
  category_name?: string;
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

