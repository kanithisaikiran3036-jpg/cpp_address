import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, LeaveStatus } from '../types';
import { api } from '../api';
import { RequestLeaveModal } from './RequestLeaveModal';
import { ReviewLeaveModal } from './ReviewLeaveModal';

interface LeaveRequestsViewProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const LeaveRequestsView: React.FC<LeaveRequestsViewProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<{
    message: string;
    type: 'success' | 'info';
    previewUrl?: string;
  } | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaveRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreated = (newReq: LeaveRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    setNotificationBanner({
      message: `Leave request for ${newReq.leaveType} (${newReq.totalDays} days) submitted successfully! Routed to Administrator for approval.`,
      type: 'success',
    });
    setTimeout(() => setNotificationBanner(null), 8000);
  };

  const handleReviewed = (updatedReq: LeaveRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    setNotificationBanner({
      message: `Leave request ${updatedReq.id} has been ${updatedReq.status.toUpperCase()}! Notification email dispatched to ${updatedReq.staffEmail}.`,
      type: 'success',
    });
    setTimeout(() => setNotificationBanner(null), 8000);
  };

  // Quick 1-click decision for admin
  const handleQuickDecision = async (leave: LeaveRequest, decision: 'Approved' | 'Rejected') => {
    try {
      const res = await api.reviewLeaveRequest(leave.id, {
        status: decision,
        adminNotes: decision === 'Approved' ? 'Approved by Administrator' : 'Rejected by Administrator',
        reviewerName: currentUser?.name || 'System Administrator',
      });
      if (res.success && res.leaveRequest) {
        handleReviewed(res.leaveRequest);
      }
    } catch (err) {
      console.error('Quick decision error:', err);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    // If staff member, show their own requests unless admin
    if (!isAdmin && currentUser && r.staffEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      return false;
    }

    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.staffName.toLowerCase().includes(q) ||
        r.staffEmail.toLowerCase().includes(q) ||
        r.staffId.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.leaveType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-12">
      {/* Notification Banner */}
      {notificationBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">
              mark_email_read
            </span>
            <span className="text-[13px] font-medium">{notificationBanner.message}</span>
          </div>
          {notificationBanner.previewUrl && (
            <a
              href={notificationBanner.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-emerald-700 underline hover:text-emerald-900"
            >
              View Email Preview
            </a>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-[12px] font-mono text-blue-700 font-bold uppercase tracking-wider">
              {isAdmin ? 'Administrative Approval Center' : 'My Leave Applications'}
            </span>
          </div>
          <h2 className="font-headline text-[26px] md:text-[30px] font-bold text-slate-900">
            Staff Leave Requests & Approvals
          </h2>
          <p className="text-[14px] text-slate-500">
            {isAdmin
              ? 'Review staff leave descriptions, verify coverage, and accept or reject requests with automated notifications.'
              : 'Submit time-off requests with full leave descriptions, and monitor administrator acceptance or rejection.'}
          </p>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[19px]">add_circle</span>
            <span>Request Leave</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Total Requests
          </span>
          <div className="text-[26px] font-bold text-slate-900 font-headline">{totalCount}</div>
          <span className="text-[12px] text-slate-500">All submissions logged</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-mono text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Pending Review</span>
          </span>
          <div className="text-[26px] font-bold text-amber-600 font-headline">{pendingCount}</div>
          <span className="text-[12px] text-amber-700/80">Requires Admin Decision</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-[11px] font-mono text-emerald-700 uppercase tracking-wider block mb-1">
            Accepted / Approved
          </span>
          <div className="text-[26px] font-bold text-emerald-600 font-headline">{approvedCount}</div>
          <span className="text-[12px] text-emerald-700/80">Authorized leaves</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <span className="text-[11px] font-mono text-rose-700 uppercase tracking-wider block mb-1">
            Rejected
          </span>
          <div className="text-[26px] font-bold text-rose-600 font-headline">{rejectedCount}</div>
          <span className="text-[12px] text-rose-700/80">Declined requests</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'Pending'
                ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              statusFilter === 'Approved'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              statusFilter === 'Rejected'
                ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search staff, leave type, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[14px]">Loading staff leave requests from C++ storage engine...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <span className="material-symbols-outlined text-[24px]">event_busy</span>
          </div>
          <h3 className="font-semibold text-[16px] text-slate-800 mb-1">No Leave Requests Found</h3>
          <p className="text-[13px] text-slate-500 max-w-md mb-4">
            {searchQuery
              ? 'No leave requests match your search criteria. Try a different keyword.'
              : statusFilter !== 'all'
              ? `There are currently no leave requests with status "${statusFilter}".`
              : 'No leave applications have been submitted yet.'}
          </p>
          {currentUser && (
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-medium hover:bg-blue-700 transition-colors"
            >
              Submit First Leave Request
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-xs flex flex-col gap-4 ${
                  isPending
                    ? 'border-amber-200 ring-1 ring-amber-100'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Row: Staff info + Status + ID */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-[14px] flex items-center justify-center border border-blue-100">
                      {req.staffName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[15px] font-bold text-slate-900">
                          {req.staffName}
                        </strong>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {req.staffId}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                          {req.department}
                        </span>
                      </div>
                      <span className="text-[12px] text-slate-500 font-mono">{req.staffEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Ref: {req.id}</span>
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-bold font-mono border flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Second Row: Leave Dates & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl text-[13px]">
                  <div>
                    <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                      Leave Type
                    </span>
                    <strong className="text-slate-800 font-medium">{req.leaveType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                      Leave Window / Duration
                    </span>
                    <strong className="text-slate-800 font-mono text-[12px]">
                      {req.startDate} → {req.endDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
                      Total Days
                    </span>
                    <strong className="text-slate-900 font-mono">
                      {req.totalDays} day{req.totalDays > 1 ? 's' : ''} requested
                    </strong>
                  </div>
                </div>

                {/* Third Row: Leave Description (User Requirement) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-slate-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">description</span>
                    <span>Description for the Leave:</span>
                  </span>
                  <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/80 text-[13px] text-slate-800 leading-relaxed font-sans">
                    {req.reason}
                  </div>
                </div>

                {/* Coverage & Emergency Info if provided */}
                {(req.handoverNotes || req.emergencyContact) && (
                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-600 pt-1">
                    {req.handoverNotes && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        <span>Handover: <strong>{req.handoverNotes}</strong></span>
                      </span>
                    )}
                    {req.emergencyContact && (
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">call</span>
                        <span>Contact: <strong>{req.emergencyContact}</strong></span>
                      </span>
                    )}
                  </div>
                )}

                {/* Admin Feedback Notes & Decision Info if already reviewed */}
                {!isPending && (
                  <div
                    className={`p-3 rounded-xl border text-[12px] flex flex-col gap-1 ${
                      isApproved
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          {isApproved ? 'check_circle' : 'cancel'}
                        </span>
                        <span>Admin Decision: {req.status}</span>
                      </span>
                      {req.reviewedAt && (
                        <span className="text-[11px] font-normal text-slate-500">
                          {new Date(req.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {req.adminNotes && (
                      <p className="text-[12px] italic text-slate-700 pl-5">
                        "{req.adminNotes}"
                      </p>
                    )}
                    <span className="text-[11px] text-slate-500 pl-5">
                      Reviewed by {req.reviewedBy || 'System Administrator'}
                    </span>
                  </div>
                )}

                {/* Admin Actions Bar for Pending Requests (User Requirement: Accept or Reject by Admin) */}
                {isAdmin && isPending && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <span className="material-symbols-outlined text-[16px] text-amber-500">
                        notification_important
                      </span>
                      <span>Action required: Accept or reject this leave request for {req.staffName}.</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Detailed Review with Notes Modal Button */}
                      <button
                        type="button"
                        onClick={() => setReviewingLeave(req)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="Review details and add admin feedback note"
                      >
                        <span className="material-symbols-outlined text-[16px]">comment</span>
                        <span>Review & Note</span>
                      </button>

                      {/* 1-Click Reject */}
                      <button
                        type="button"
                        onClick={() => handleQuickDecision(req, 'Rejected')}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Reject</span>
                      </button>

                      {/* 1-Click Accept */}
                      <button
                        type="button"
                        onClick={() => handleQuickDecision(req, 'Approved')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Accept & Approve</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request Leave Modal */}
      {requestModalOpen && currentUser && (
        <RequestLeaveModal
          user={currentUser}
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Review Leave Modal */}
      {reviewingLeave && (
        <ReviewLeaveModal
          leave={reviewingLeave}
          isOpen={!!reviewingLeave}
          onClose={() => setReviewingLeave(null)}
          onReviewed={handleReviewed}
          adminName={currentUser?.name || 'System Administrator'}
        />
      )}
    </div>
  );
};
