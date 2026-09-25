export interface User {
  id: string;
  staff_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  status: 'Active' | 'Inactive' | 'Suspended';
  department: string;
  location: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardOverview {
  total_users: number;
  active_users: number;
  staff: number;
  departments: number;
  locations: number;
  system_mode?: string;
  storage?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  headcount: number;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  timezone: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  job_title: string;
  address: string;
  is_key_account: number;
  is_archived: number;
  avatar_url: string;
  tags: string;
  created_at: string;
  updated_at: string;
  last_contacted_at: string;
}

export interface Note {
  id: string;
  contact_id: string;
  content: string;
  author: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  actor_name: string;
  action: string;
  description: string;
  created_at: string;
}

export interface DistributionItem {
  category: string;
  count: number;
  color: string;
}

export interface AnalyticsData {
  total_contacts: number;
  active_groups: number;
  recent_activity: number;
  top_category: {
    name: string;
    percentage: number;
  };
  distribution: DistributionItem[];
}

export interface EngineStatus {
  engine_version: string;
  compiler: string;
  platform_os?: string;
  windows_compatible?: boolean;
  sqlite_version: string;
  journal_mode: string;
  cache_size_mb: number;
  status: string;
  in_memory_temp?: boolean;
  prepared_statements?: boolean;
  access_control?: string;
  server_runtime?: string;
}

export interface BenchmarkResult {
  iterations: number;
  insert_duration_ms: number;
  insert_ops_per_sec: number;
  avg_write_latency_us: number;
  read_duration_ms?: number;
  rows_queried?: number;
  journal_mode: string;
  synchronous_mode?: string;
  storage_engine: string;
}

export interface DispatchedEmail {
  id: string;
  to: string;
  toName?: string;
  subject: string;
  code: string;
  sentAt: string;
  previewUrl?: string;
  text: string;
  html: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  email?: string;
  name?: string;
  codePreview?: string;
  previewUrl?: string;
  error?: string;
}

export type LeaveType =
  | 'Annual Leave'
  | 'Sick Leave'
  | 'Casual / Personal Leave'
  | 'Emergency Leave'
  | 'Maternity / Paternity Leave'
  | 'Bereavement Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact?: string;
  handoverNotes?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  notificationSent?: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'users'
  | 'leave-requests'
  | 'departments'
  | 'locations'
  | 'reports'
  | 'activity-logs'
  | 'settings'
  | 'profile'
  | 'staff-status'
  | 'contacts'
  | 'analytics'
  | 'contact-details'
  | 'add-contact'
  | 'edit-contact'
  | 'groups'
  | 'archive'
  | 'engine-inspector';
