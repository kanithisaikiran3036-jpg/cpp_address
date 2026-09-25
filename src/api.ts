import {
  User,
  DashboardOverview,
  Department,
  Location,
  ActivityLog,
  EngineStatus,
  Contact,
  Note,
  AnalyticsData,
  BenchmarkResult,
  LeaveRequest,
} from './types';

export const api = {
  // Authentication & Staff User Management (Screenshot 1 & 2)
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message?: string;
    email?: string;
    name?: string;
    codePreview?: string;
    previewUrl?: string;
    error?: string;
  }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async verifyCode(email: string, code: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return res.json();
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return res.json();
  },

  async getLatestEmail(email?: string): Promise<any> {
    const url = email ? `/api/auth/latest-email?email=${encodeURIComponent(email)}` : '/api/auth/latest-email';
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  },

  async getOverview(): Promise<DashboardOverview> {
    const res = await fetch('/api/overview');
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  },

  async getUsers(search: string = ''): Promise<{ items: User[]; total: number }> {
    const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  async createStaff(
    data: {
      name: string;
      email: string;
      password?: string;
      department?: string;
      location?: string;
      phone?: string;
      status?: string;
    },
    callerId: string = 'u_admin_sole'
  ): Promise<{ success: boolean; staff_id?: string; user?: User; error?: string }> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': callerId,
      },
      body: JSON.stringify({ ...data, caller_id: callerId }),
    });
    return res.json();
  },

  async updateUser(
    id: string,
    data: Partial<User & { password?: string; reason?: string }>,
    callerId: string = 'u_admin_sole'
  ): Promise<{ success: boolean; user?: User; notificationSent?: boolean; notifiedEmail?: string; error?: string }> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': callerId,
      },
      body: JSON.stringify({ ...data, caller_id: callerId }),
    });
    return res.json();
  },

  async updateStaffStatus(
    id: string,
    status: 'Active' | 'Inactive' | 'Suspended',
    reason?: string,
    callerId: string = 'u_admin_sole'
  ): Promise<{
    success: boolean;
    user?: User;
    notificationSent?: boolean;
    email?: string;
    newStatus?: string;
    oldStatus?: string;
    previewUrl?: string;
    error?: string;
  }> {
    const res = await fetch(`/api/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': callerId,
      },
      body: JSON.stringify({ status, reason, caller_id: callerId }),
    });
    return res.json();
  },

  async deleteUser(id: string, callerId: string = 'u_admin_sole'): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`/api/users/${id}?caller_id=${encodeURIComponent(callerId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': callerId },
    });
    return res.json();
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) return [];
    return res.json();
  },

  async getLocations(): Promise<Location[]> {
    const res = await fetch('/api/locations');
    if (!res.ok) return [];
    return res.json();
  },

  async getActivity(contactId?: string): Promise<ActivityLog[]> {
    const res = await fetch('/api/activity');
    if (!res.ok) return [];
    return res.json();
  },

  async getStatus(): Promise<EngineStatus> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status failed');
    return res.json();
  },

  async runBenchmark(iterations: number = 1000): Promise<BenchmarkResult> {
    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iterations }),
    });
    if (!res.ok) throw new Error('Benchmark failed');
    return res.json();
  },

  // Leave Requests Endpoints
  async getLeaveRequests(params?: { userId?: string; email?: string; status?: string }): Promise<LeaveRequest[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.email) query.set('email', params.email);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`/api/leave-requests${qs}`);
    if (!res.ok) return [];
    return res.json();
  },

  async createLeaveRequest(
    data: Partial<LeaveRequest>
  ): Promise<{ success: boolean; leaveRequest?: LeaveRequest; message?: string; error?: string }> {
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async reviewLeaveRequest(
    id: string,
    decision: { status: 'Approved' | 'Rejected'; adminNotes?: string; reviewerName?: string }
  ): Promise<{
    success: boolean;
    leaveRequest?: LeaveRequest;
    notificationSent?: boolean;
    email?: string;
    previewUrl?: string;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`/api/leave-requests/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision),
    });
    return res.json();
  },

  // Supporting contact methods
  async getContacts(_params?: any): Promise<{ total: number; items: Contact[] }> {
    return { total: 0, items: [] };
  },

  async getContact(_id: string): Promise<Contact> {
    throw new Error('Use getUser instead');
  },

  async createContact(_data: any): Promise<any> {
    return { success: true };
  },

  async updateContact(_id: string, _data: any): Promise<any> {
    return { success: true };
  },

  async deleteContact(_id: string): Promise<any> {
    return { success: true };
  },

  async toggleArchive(_id: string, _archive: boolean): Promise<any> {
    return { success: true };
  },

  async getNotes(_contactId: string): Promise<Note[]> {
    return [];
  },

  async addNote(_contactId: string, _content: string, _author?: string): Promise<any> {
    return { success: true };
  },

  async getAnalytics(): Promise<AnalyticsData> {
    return {
      total_contacts: 1248,
      active_groups: 24,
      recent_activity: 89,
      top_category: { name: 'Clients', percentage: 45 },
      distribution: [
        { category: 'Clients', count: 560, color: '#004ac6' },
        { category: 'Vendors', count: 315, color: '#2563eb' },
        { category: 'Partners', count: 210, color: '#505f76' },
        { category: 'Internal', count: 163, color: '#737686' },
      ],
    };
  },
};
