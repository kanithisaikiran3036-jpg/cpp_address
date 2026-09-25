import React, { useState, useEffect } from 'react';
import { ActiveTab, User, DashboardOverview } from './types';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { DashboardView } from './components/DashboardView';
import { UsersView } from './components/UsersView';
import { StaffStatusView } from './components/StaffStatusView';
import { LeaveRequestsView } from './components/LeaveRequestsView';
import { DepartmentsView } from './components/DepartmentsView';
import { LocationsView } from './components/LocationsView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('nexus_directory_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [selectedStaffForStatus, setSelectedStaffForStatus] = useState<User | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, overviewRes] = await Promise.all([
        api.getUsers(),
        api.getOverview(),
      ]);
      setUsers(usersRes.items || []);
      setOverview(overviewRes);
    } catch (err) {
      console.error('Failed to load directory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStaff = async (data: {
    name: string;
    email: string;
    password?: string;
    department?: string;
    location?: string;
    phone?: string;
    status?: string;
  }) => {
    if (currentUser?.role !== 'Admin') {
      showToast('Unauthorized: Only Administrator can add staff.', 'error');
      return;
    }

    const res = await api.createStaff(data, currentUser?.id || 'u_admin_sole');
    if (res.success && res.user) {
      showToast(`Staff member "${res.user.name}" created with ID: ${res.user.staff_id}!`);
      loadData();
    } else {
      showToast(res.error || 'Failed to create staff', 'error');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (currentUser?.role !== 'Admin') {
      showToast('Unauthorized: Only Administrator can delete users.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${name} from the directory?`)) {
      return;
    }

    const res = await api.deleteUser(id, currentUser?.id || 'u_admin_sole');
    if (res.success) {
      showToast(`User "${name}" removed from directory`);
      loadData();
    } else {
      showToast(res.error || 'Failed to delete user', 'error');
    }
  };

  const handleViewUserStatus = (user: User) => {
    setSelectedStaffForStatus(user);
    setActiveTab('staff-status');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('nexus_directory_active_user', JSON.stringify(user));
    } catch (e) {}
    showToast(`Signed in successfully as ${user.name} (${user.role})`);
    if (user.role === 'Staff') {
      // Direct staff to their status view
      setSelectedStaffForStatus(user);
      setActiveTab('staff-status');
    } else {
      setActiveTab('dashboard');
    }
    setLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('nexus_directory_active_user');
    } catch (e) {}
    showToast('Signed out successfully. Please sign in to continue.', 'info');
  };

  // Determine page title for top bar matching Screenshots
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'users':
        return 'Staff';
      case 'leave-requests':
        return 'Leave Requests & Approvals';
      case 'departments':
        return 'Departments';
      case 'locations':
        return 'Locations';
      case 'reports':
        return 'Reports';
      case 'activity-logs':
        return 'Activity Logs';
      case 'staff-status':
        return 'Staff Status';
      case 'settings':
        return 'Settings';
      case 'profile':
        return 'Profile';
      default:
        return 'Network Directory';
    }
  };

  // When opening the website, the first page displayed is the login page for staff or admin login
  if (!currentUser) {
    return (
      <div className="relative">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 p-3.5 rounded-xl border text-[13px] font-medium flex items-center gap-2 shadow-lg transition-all ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          availableUsers={users}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans">
      {/* Sidebar Navigation matching Screenshot 1 & 2 */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
        {/* Top Navigation Bar matching Screenshot 1 & 2 */}
        <TopNavBar
          pageTitle={getPageTitle()}
          currentUser={currentUser}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
          onOpenLoginModal={() => setLoginModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-[1280px] w-full mx-auto">
          {/* Toast alert */}
          {toast && (
            <div
              className={`mb-4 p-3.5 rounded-xl border text-[13px] font-medium flex items-center gap-2 shadow-xs transition-all ${
                toast.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {toast.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{toast.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-[#64748b] gap-3">
              <div className="w-10 h-10 border-3 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[14px] font-medium text-[#0f172a]">
                Reading records from C++ SQLite WAL Engine...
              </p>
            </div>
          ) : (
            <>
              {/* Dashboard View matching Screenshot 1 */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  overview={overview}
                  currentUser={currentUser}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {/* Staff / Users View matching Screenshot 2 */}
              {activeTab === 'users' && (
                <UsersView
                  users={users}
                  currentUser={currentUser}
                  onAddStaff={handleAddStaff}
                  onEditUser={(u) => {
                    handleViewUserStatus(u);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onViewUserStatus={handleViewUserStatus}
                  onRefreshData={loadData}
                />
              )}

              {/* Leave Requests & Approvals (Admin accepts/rejects, Staff requests with description) */}
              {activeTab === 'leave-requests' && (
                <LeaveRequestsView
                  currentUser={currentUser}
                  onRefreshData={loadData}
                />
              )}

              {/* Staff Status View (User requirement: Staff view status by login) */}
              {activeTab === 'staff-status' && selectedStaffForStatus && (
                <StaffStatusView
                  user={selectedStaffForStatus}
                  currentUser={currentUser}
                  onBackToDirectory={() => setActiveTab('users')}
                  onStatusUpdated={(_u) => {
                    loadData();
                  }}
                />
              )}

              {/* Departments View */}
              {activeTab === 'departments' && <DepartmentsView />}

              {/* Locations View */}
              {activeTab === 'locations' && <LocationsView />}

              {/* Reports View */}
              {activeTab === 'reports' && (
                <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 max-w-3xl">
                  <h3 className="font-headline text-[22px] font-bold text-[#0f172a] mb-2">
                    Directory Reports & Metrics
                  </h3>
                  <p className="text-[14px] text-[#64748b] mb-6">
                    Summary metrics generated by the high-performance C++ storage engine.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-[14px]">
                    <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      <span className="text-[#64748b] text-[12px] block">TOTAL ACCOUNTS</span>
                      <strong className="text-[24px] text-[#0f172a]">{users.length}</strong>
                    </div>
                    <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      <span className="text-[#64748b] text-[12px] block">ACTIVE STAFF</span>
                      <strong className="text-[24px] text-emerald-600">
                        {users.filter((u) => u.role === 'Staff' && u.status === 'Active').length}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Logs View */}
              {activeTab === 'activity-logs' && <ActivityLogsView />}

              {/* Profile View */}
              {activeTab === 'profile' && currentUser && (
                <StaffStatusView
                  user={currentUser}
                  currentUser={currentUser}
                  onBackToDirectory={() => setActiveTab('dashboard')}
                />
              )}

              {/* Settings View */}
              {activeTab === 'settings' && (
                <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 max-w-2xl">
                  <h3 className="font-headline text-[22px] font-bold text-[#0f172a] mb-2">
                    Directory Settings
                  </h3>
                  <p className="text-[14px] text-[#64748b] mb-6">
                    Sole administrator access controls and authentication policies.
                  </p>
                  <div className="space-y-4 text-[13px]">
                    <div className="p-4 bg-[#eff6ff] rounded-xl border border-[#bfdbfe]">
                      <strong className="text-[#1e40af] block mb-1">Single Administrator Model</strong>
                      <p className="text-[#1e3a8a]">
                        The directory is secured so only one administrator (<strong>{users.find(u => u.role === 'Admin')?.email || 'System Administrator'}</strong>) can add or provision staff. Staff credentials grant view-only access to their verified status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Login Modal with Email & Password */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
