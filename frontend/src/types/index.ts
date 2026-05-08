export type Role = "ADMIN" | "SITE_ENGINEER" | "PROJECT_MANAGER" | "ACCOUNTANT" | "MANAGEMENT_VIEWER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  preferred_language: "en" | "ar";
}

export interface Project {
  id: number;
  name: string;
  code: string;
  client_name: string;
  location: string;
  description: string;
  currency: string;
  start_date?: string;
  end_date?: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
}

export interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface Vendor {
  id: number;
  name: string;
  vendor_type: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  notes: string;
  is_active: boolean;
}

export interface Expense {
  id: number;
  project: number;
  project_detail?: Project;
  category: number;
  category_detail?: Category;
  vendor?: number | null;
  vendor_detail?: Vendor | null;
  description: string;
  expense_date: string;
  expense_month: string;
  quantity: string;
  unit: string;
  unit_rate: string;
  amount_before_vat: string;
  vat_percentage: string;
  vat_amount: string;
  total_amount: string;
  paid_amount: string;
  pending_amount: string;
  payment_status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  approval_status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  rejection_reason?: string;
  notes?: string;
}

export interface Payment {
  id: number;
  expense: number;
  expense_detail?: Expense;
  project: number;
  payment_date: string;
  amount: string;
  payment_method: string;
  reference_number: string;
  notes?: string;
}

export interface CashIn {
  id: number;
  project: number;
  project_detail?: Project;
  payment_type: string;
  reference_number: string;
  amount: string;
  received_date: string;
  notes?: string;
}

export interface Attachment {
  id: number;
  original_file_name: string;
  file_type: string;
  file_size: number;
  related_type: "EXPENSE" | "PAYMENT" | "CASH_IN";
  related_id: number;
  download_url: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
