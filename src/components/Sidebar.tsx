import React, { useState, useEffect } from 'react';
import { ActiveTab, User } from '../types';
import { api } from '../api';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) => {
  const isAdmin = currentUser?.role === 'Admin';
  const [pendingLeaveCount, setPendingLeaveCount] = useState<number>(0);

  useEffect(() => {
    api
      .getLeaveRequests()
      .then((reqs) => {
        if (!isAdmin && currentUser) {
          const userPending = reqs.filter(
            (r) => r.status === 'Pending' && r.staffEmail.toLowerCase() === currentUser.email.toLowerCase()
          ).length;
          setPendingLeaveCount(userPending);
        } else {
          const pending = reqs.filter((r) => r.status === 'Pending').length;
          setPendingLeaveCount(pending);
        }
      })
      .catch(() => {});
  }, [activeTab, isAdmin, currentUser]);

  const navItems: { id: ActiveTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'users', label: 'Users', icon: 'group' },
    {
      id: 'leave-requests',
      label: 'Leave Requests',
      icon: 'event_busy',
      badge: pendingLeaveCount > 0 ? pendingLeaveCount : undefined,
    },
    { id: 'departments', label: 'Departments', icon: 'domain' },
    { id: 'locations', label: 'Locations', icon: 'location_on' },
    { id: 'reports', label: 'Reports', icon: 'insert_chart' },
    { id: 'activity-logs', label: 'Activity Logs', icon: 'history' },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#e5e7eb] flex flex-col py-6 px-4 gap-1 z-50 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">hub</span>
          </div>
          <div>
            <h1 className="font-headline text-[17px] font-bold text-[#1e40af] leading-tight">
              System Admin
            </h1>
            <p className="text-[12px] text-[#64748b] font-medium">Network Directory</p>
          </div>
        </div>

        {/* Main Nav Items matching Screenshot 1 */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full text-left font-medium rounded-xl flex items-center gap-3 py-2.5 px-3.5 transition-all text-[14px] cursor-pointer ${
                  isActive
                    ? 'bg-[#eff6ff] text-[#1d4ed8] font-semibold'
                    : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-[#1d4ed8]' : 'text-[#64748b]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Staff specific status portal button if logged in as staff */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => handleSelectTab('staff-status')}
              className={`w-full text-left font-medium rounded-xl flex items-center gap-3 py-2.5 px-3.5 transition-all text-[14px] cursor-pointer mt-2 border ${
                activeTab === 'staff-status'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'text-emerald-700 bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                badge
              </span>
              <span className="flex-1">My Staff Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}
        </nav>

        {/* Bottom Nav Items matching Screenshot 1 */}
        <div className="mt-auto border-t border-[#e2e8f0] pt-4 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleSelectTab('settings')}
            className={`w-full text-left rounded-xl flex items-center gap-3 py-2.5 px-3.5 transition-all text-[14px] cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#eff6ff] text-[#1d4ed8] font-semibold'
                : 'text-[#475569] hover:bg-[#f8fafc]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('profile')}
            className={`w-full text-left rounded-xl flex items-center gap-3 py-2.5 px-3.5 transition-all text-[14px] cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#eff6ff] text-[#1d4ed8] font-semibold'
                : 'text-[#475569] hover:bg-[#f8fafc]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span>Profile</span>
          </button>

          {/* User Role Tag */}
          <div className="mt-2 p-2.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-[11px] font-mono flex items-center justify-between">
            <span className="text-[#64748b]">ROLE:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                isAdmin
                  ? 'bg-[#dbeafe] text-[#1d4ed8]'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentUser?.role || 'Admin'}
            </span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-1 w-full text-left rounded-xl flex items-center gap-2.5 py-2 px-3 transition-colors text-[13px] text-red-600 hover:bg-red-50 cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
