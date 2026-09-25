import React, { useState } from 'react';
import { User } from '../types';
import { EditStaffStatusModal } from './EditStaffStatusModal';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onAddStaff: (data: {
    name: string;
    email: string;
    password?: string;
    department?: string;
    location?: string;
    phone?: string;
    status?: string;
  }) => Promise<void>;
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string, name: string) => void;
  onViewUserStatus: (user: User) => void;
  onRefreshData?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onAddStaff,
  onEditUser,
  onDeleteUser,
  onViewUserStatus,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusEditUser, setStatusEditUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [department, setDepartment] = useState('Operations');
  const [location, setLocation] = useState('Seattle HQ');
  const [phone, setPhone] = useState('+1 (555) 019-8273');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.staff_id.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Unauthorized: Only the System Administrator can add staff.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await onAddStaff({
        name: name.trim(),
        email: email.trim(),
        password,
        department,
        location,
        phone,
        status: 'Active',
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('password123');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h2 className="font-headline text-[26px] md:text-[28px] font-bold text-[#0f172a]">
          Staff
        </h2>
        <p className="text-[14px] text-[#64748b]">
          Manage and review verified personnel records within the network directory.
        </p>
      </div>

      {/* Notice Banner for Staff vs Admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-[13px] text-amber-900">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[22px]">lock</span>
            <span>
              <strong>Staff View Mode:</strong> You are logged in as a staff member ({currentUser?.name}). Only the System Administrator can create or modify staff accounts.
            </span>
          </div>
          <button
            onClick={() => currentUser && onViewUserStatus(currentUser)}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-medium rounded-lg shrink-0 cursor-pointer transition-colors"
          >
            View My Status
          </button>
        </div>
      )}

      {/* Top Controls: Search Input & + Add Staff button matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search by name, email, staff ID... */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, staff ID..."
            className="w-full h-11 px-4 bg-white border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] shadow-2xs transition-all"
          />
        </div>

        {/* + Add Staff Button */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-11 px-5 bg-[#0052cc] hover:bg-[#0043a8] text-white font-medium text-[14px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:translate-y-px cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Staff</span>
          </button>
        ) : (
          <div
            title="Only the administrator can add staff"
            className="h-11 px-5 bg-slate-100 border border-slate-200 text-slate-400 font-medium text-[14px] rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Add Staff (Admin Only)</span>
          </div>
        )}
      </div>

      {/* Staff Table matching Screenshot 2 */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Staff ID
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Name
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Email
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Role
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Status
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#475569] tracking-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[14px]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748b]">
                    No staff records found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSoleAdmin = u.role === 'Admin';
                  return (
                    <tr
                      key={u.id}
                      onClick={() => onViewUserStatus(u)}
                      className="hover:bg-[#f8fafc] transition-colors cursor-pointer"
                    >
                      {/* Staff ID */}
                      <td className="px-6 py-4 font-mono text-[13px] text-[#475569]">
                        {u.staff_id}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 font-medium text-[#0f172a]">
                        {u.name}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-[#475569] font-normal">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 text-[#475569]">
                        {u.role}
                      </td>

                      {/* Status - Color Coded with Interactive Admin Quick Edit */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && u.role === 'Staff' ? (
                          <button
                            type="button"
                            onClick={() => setStatusEditUser(u)}
                            title="Admin: Click to edit staff status & notify via email"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-all border shadow-2xs hover:scale-105 cursor-pointer ${
                              u.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : u.status === 'Suspended'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.status === 'Active'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : u.status === 'Suspended'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{u.status}</span>
                            <span className="material-symbols-outlined text-[13px] text-slate-400">
                              edit
                            </span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${
                              u.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : u.status === 'Suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : u.status === 'Suspended'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{u.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3 text-[13px]">
                          {/* Edit Status Button for Admin */}
                          {isAdmin && u.role === 'Staff' && (
                            <button
                              type="button"
                              onClick={() => setStatusEditUser(u)}
                              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                              title="Edit status and notify staff through email"
                            >
                              <span className="material-symbols-outlined text-[15px]">mail</span>
                              <span>Status</span>
                            </button>
                          )}

                          {/* Edit / View action */}
                          <button
                            type="button"
                            onClick={() => onEditUser(u)}
                            disabled={!isAdmin && currentUser?.id !== u.id}
                            className={`font-medium transition-colors cursor-pointer ${
                              isAdmin || currentUser?.id === u.id
                                ? 'text-[#2563eb] hover:underline'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            View
                          </button>

                          {/* Delete action */}
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id, u.name)}
                            disabled={!isAdmin || isSoleAdmin}
                            className={`font-medium transition-colors cursor-pointer ${
                              isAdmin && !isSoleAdmin
                                ? 'text-[#dc2626] hover:underline'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={isSoleAdmin ? 'Cannot delete sole admin' : 'Delete staff record'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal - Only Admin Can Add Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e5e7eb] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
              <div>
                <h3 className="font-headline text-[18px] font-bold text-[#0f172a]">
                  Add Staff Member
                </h3>
                <p className="text-[12px] text-[#64748b]">
                  Administrator exclusive action: Generate new staff credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Kim"
                  required
                  className="w-full h-10 px-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="d.kim@nexus.corp"
                  required
                  className="w-full h-10 px-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Initial Password (Staff will use this to login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                  className="w-full h-10 px-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#334155] block mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#334155] block mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Seattle HQ">Seattle HQ</option>
                    <option value="San Francisco">San Francisco</option>
                    <option value="New York">New York</option>
                    <option value="Austin Hub">Austin Hub</option>
                    <option value="London Office">London Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-10 px-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[14px] font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#334155] block mb-1">
                  Initial Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[#f8fafc] border border-[#d1d5db] rounded-xl text-[13px] text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="Active">Active (Full operational directory access)</option>
                  <option value="Suspended">Suspended (Access privileges on hold)</option>
                  <option value="Inactive">Inactive (Archived profile)</option>
                </select>
              </div>

              <div className="p-3 bg-[#eff6ff] rounded-xl text-[12px] text-[#1e40af] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>
                  The next unique Staff ID will be assigned automatically by the C++ engine.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[14px] text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0052cc] hover:bg-[#0043a8] text-white font-medium text-[14px] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Save Staff to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Status Modal with Automated Email Notification */}
      <EditStaffStatusModal
        user={statusEditUser}
        isOpen={!!statusEditUser}
        onClose={() => setStatusEditUser(null)}
        onStatusUpdated={(_updated) => {
          onRefreshData?.();
        }}
        currentUser={currentUser}
      />
    </div>
  );
};
