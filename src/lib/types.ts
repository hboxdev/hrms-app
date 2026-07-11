export type Role = 'admin' | 'user' | 'manager' | 'human_resource' | 'operation_manager' | 'finance' | 'sales';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  status: string;
  employee_code: string | null;
  profile_image: string | null;
  shift_id: number | null;
  department_name: string | null;
  designation_name: string | null;
};

export type Team = {
  id: number;
  name: string;
  category: string;
  member_type?: string;
  team_role?: string;
  member_count?: number;
  is_active?: number;
};

export type Invoice = {
  id: number;
  invoice_no: string;
  customer_name: string;
  service_name: string;
  total_amount: string;
  status: string;
  payment_type: string;
  paid_at: string | null;
  created_at: string;
  owner_name: string;
};

export type InvoiceDetail = Invoice & {
  notes?: string;
  owner_email?: string;
  payments: Array<{ id: number; amount: string; gateway?: string; method?: string; created_at: string }>;
};

export type Pagination = { page: number; limit: number; total: number; pages: number };

export type DashboardTeamRow = {
  id: number;
  name: string;
  category: string;
  revenue: number;
  expense: number;
  profit: number;
  roi: number | null;
  tax: number;
  breakdown: { salary: number; sitting: number; ads: number; subs: number };
};

export type DashboardData = {
  period: { from: string; to: string; months: number };
  totals: { revenue: number; expense: number; profit: number; roi: number | null; tax: number; merchant_fee_percent: number };
  teams: DashboardTeamRow[];
  recent_payments: Array<{
    id: number;
    owner_name: string;
    customer_name: string;
    total_amount: string;
    paid_at: string;
    payment_type: string;
    tax_amount: number;
  }>;
};

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: string;
  employee_code: string | null;
  profile_image: string | null;
  department_name: string | null;
  designation_name: string | null;
  member_type?: string;
  team_role?: string;
  salary_pkr: number;
};

export type TeamDetail = DashboardTeamRow & {
  period: { from: string; to: string; months: number };
  members: TeamMember[];
};

export type PerformanceData = {
  period: { from: string; to: string };
  revenue: number;
  invoice_count: number;
  target: number;
  achievement_pct: number | null;
  by_type: Array<{ payment_type: string; count: number; amount: string }>;
};

export type Payslip = {
  id: number;
  salary_month: number;
  salary_year: number;
  gross_salary: string;
  net_salary: string;
  final_salary: string;
  status: 'paid' | 'pending';
  paid_date: string | null;
};

export type PayslipDetail = Payslip & {
  basic_salary: string;
  fuel_allowance: string;
  car_allowance: string;
  attendance_allowance: string;
  bonus: string;
  deduction: string;
  late_deduction: string;
  absent_deduction: string;
  half_day_deduction: string;
  penalty: string;
  approved_leaves: string;
  security_fund: string;
  rooftop_food_deduction: string;
  arrears_amount: string;
  notes: string | null;
  status_history: Array<{ old_status: string | null; new_status: string; changed_at: string; changed_by_name: string | null }>;
};

export type ShiftInfo = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_period_minutes: number;
} | null;

export type Resignation = {
  id: number;
  resignation_date: string;
  last_working_day: string;
  notice_period: string | null;
  reason: string | null;
  description: string | null;
  document_path: string | null;
  created_at: string;
};
