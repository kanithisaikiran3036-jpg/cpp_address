import React from 'react';
import { DashboardOverview, User, ActiveTab } from '../types';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  currentUser: User | null;
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  currentUser,
  onNavigate,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  const totalUsers = overview?.total_users ?? 3;
  const activeUsers = overview?.active_users ?? 3;
  const staffCount = overview?.staff ?? 2;
  const departmentsCount = overview?.departments ?? 5;
  const locationsCount = overview?.locations ?? 5;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1280px] mx-auto pb-12">
      {/* Big Blue Hero Banner matching Screenshot 1 */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white p-6 md:p-10 overflow-hidden shadow-sm">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Text */}
          <div className="flex-1 max-w-2xl">
            <span className="font-mono text-[11px] md:text-[12px] font-semibold tracking-wider text-blue-100 uppercase block mb-2">
              ADDRESS BOOK SYSTEM
            </span>
            <h2 className="font-headline text-[28px] md:text-[36px] font-extrabold text-white leading-tight mb-3">
              Network Directory Dashboard
            </h2>
            <p className="text-[14px] md:text-[16px] text-blue-50 leading-relaxed max-w-xl">
              Manage staff, departments and locations in one secure directory. Only one administrator controls access; staff use unique Staff IDs.
            </p>

            {/* Role-specific helper pill */}
            <div className="mt-5 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-[12px] font-medium text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  {isAdmin ? 'admin_panel_settings' : 'badge'}
                </span>
                {isAdmin
                  ? 'Administrator Mode: Full control to add & manage staff'
                  : `Staff Mode: Logged in as ${currentUser?.name} (${currentUser?.staff_id})`}
              </span>
            </div>
          </div>

          {/* Right Graphic: Connected ID Badges Illustration matching Screenshot 1 */}
          <div className="shrink-0 w-64 md:w-72 bg-white/15 p-4 rounded-2xl border border-white/20 backdrop-blur-xs flex items-center justify-center relative">
            <div className="flex items-center gap-4 relative">
              {/* Badge 1 */}
              <div className="w-20 h-28 bg-white rounded-xl shadow-md p-2 flex flex-col items-center justify-center gap-2 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                <div className="w-8 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              {/* Connecting line with golden dot */}
              <div className="flex items-center relative -mx-1 z-10">
                <div className="w-6 h-0.5 bg-white/80"></div>
                <div className="w-3 h-3 rounded-full bg-[#fbbf24] ring-4 ring-[#2563eb] shadow-sm"></div>
                <div className="w-6 h-0.5 bg-white/80"></div>
              </div>

              {/* Badge 2 */}
              <div className="w-20 h-28 bg-white rounded-xl shadow-md p-2 flex flex-col items-center justify-center gap-2 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                <div className="w-8 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Overview matching Screenshot 1 */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-headline text-[20px] font-bold text-[#0f172a]">
            Overview
          </h3>
          <p className="text-[14px] text-[#64748b]">
            {isAdmin
              ? 'Directory overview — you are signed in as the sole admin.'
              : `Directory overview — signed in as staff member (${currentUser?.name}). Status view active.`}
          </p>
        </div>

        {/* 5 Metric Cards matching Screenshot 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Users */}
          <div
            onClick={() => onNavigate('users')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs hover:border-[#2563eb] transition-all cursor-pointer group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <div>
              <div className="font-headline text-[28px] font-bold text-[#0f172a] leading-tight">
                {totalUsers}
              </div>
              <div className="text-[13px] text-[#64748b] font-medium mt-0.5">
                Total Users
              </div>
            </div>
          </div>

          {/* 2. Active Users */}
          <div
            onClick={() => onNavigate('users')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs hover:border-[#2563eb] transition-all cursor-pointer group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">person_check</span>
            </div>
            <div>
              <div className="font-headline text-[28px] font-bold text-[#0f172a] leading-tight">
                {activeUsers}
              </div>
              <div className="text-[13px] text-[#64748b] font-medium mt-0.5">
                Active Users
              </div>
            </div>
          </div>

          {/* 3. Staff */}
          <div
            onClick={() => onNavigate('users')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs hover:border-[#2563eb] transition-all cursor-pointer group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <div className="font-headline text-[28px] font-bold text-[#0f172a] leading-tight">
                {staffCount}
              </div>
              <div className="text-[13px] text-[#64748b] font-medium mt-0.5">
                Staff
              </div>
            </div>
          </div>

          {/* 4. Departments */}
          <div
            onClick={() => onNavigate('departments')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs hover:border-[#2563eb] transition-all cursor-pointer group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
            </div>
            <div>
              <div className="font-headline text-[28px] font-bold text-[#0f172a] leading-tight">
                {departmentsCount}
              </div>
              <div className="text-[13px] text-[#64748b] font-medium mt-0.5">
                Departments
              </div>
            </div>
          </div>

          {/* 5. Locations */}
          <div
            onClick={() => onNavigate('locations')}
            className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs hover:border-[#2563eb] transition-all cursor-pointer group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">location_on</span>
            </div>
            <div>
              <div className="font-headline text-[28px] font-bold text-[#0f172a] leading-tight">
                {locationsCount}
              </div>
              <div className="text-[13px] text-[#64748b] font-medium mt-0.5">
                Locations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Access & Leave Management Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy Box */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <div>
              <h4 className="font-headline text-[16px] font-bold text-[#0f172a]">
                Sole Administrator Directory Access
              </h4>
              <p className="text-[13px] text-[#64748b] mt-1 leading-relaxed">
                • <strong>Admin Privileges:</strong> Only the administrator can add or provision staff members.<br />
                • <strong>Staff Privileges:</strong> Staff members log in using email & password to view verified status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="w-full py-2.5 bg-[#f8fafc] hover:bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe] rounded-xl text-[13px] font-semibold transition-colors cursor-pointer text-center"
          >
            Manage Staff Directory →
          </button>
        </div>

        {/* Leave Requests Box */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">event_busy</span>
            </div>
            <div>
              <h4 className="font-headline text-[16px] font-bold text-[#0f172a]">
                Staff Leave & Absence Management
              </h4>
              <p className="text-[13px] text-[#64748b] mt-1 leading-relaxed">
                • <strong>Staff Applications:</strong> Request leave with comprehensive description, dates & handover.<br />
                • <strong>Admin Decisions:</strong> Review, accept, or reject requests with automated email notices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('leave-requests')}
            className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer text-center shadow-xs"
          >
            Open Leave Requests & Approvals →
          </button>
        </div>
      </div>
    </div>
  );
};
