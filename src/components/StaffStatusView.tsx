import React, { useState, useEffect } from 'react';
import { User, LeaveRequest } from '../types';
import { EditStaffStatusModal } from './EditStaffStatusModal';
import { RequestLeaveModal } from './RequestLeaveModal';
import { ReviewLeaveModal } from './ReviewLeaveModal';
import { api } from '../api';

interface StaffStatusViewProps {
  user: User;
  onBackToDirectory: () => void;
  currentUser: User | null;
  onStatusUpdated?: (updatedUser: User) => void;
}

export const StaffStatusView: React.FC<StaffStatusViewProps> = ({
  user: initialUser,
  onBackToDirectory,
  currentUser,
  onStatusUpdated,
}) => {
  const [user, setUser] = useState<User>(initialUser);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [userLeaveRequests, setUserLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isSelf = currentUser?.id === user.id;
  const isAdmin = currentUser?.role === 'Admin';

  const loadLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const data = await api.getLeaveRequests({ email: user.email });
      setUserLeaveRequests(data);
    } catch (err) {
      console.error('Failed to load user leave requests:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [user.email]);

  const handleStatusUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    onStatusUpdated?.(updatedUser);
  };

  const handleLeaveCreated = (newReq: LeaveRequest) => {
    setUserLeaveRequests((prev) => [newReq, ...prev]);
    setNotification(
      `Leave request (${newReq.leaveType} - ${newReq.totalDays} days) successfully submitted with your description! Awaiting Administrator review.`
    );
    setTimeout(() => setNotification(null), 7000);
  };

  const handleLeaveReviewed = (updatedReq: LeaveRequest) => {
    setUserLeaveRequests((prev) =>
      prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
    );
    setNotification(
      `Leave request ${updatedReq.id} marked as ${updatedReq.status.toUpperCase()}! Official email dispatched to ${user.email}.`
    );
    setTimeout(() => setNotification(null), 7000);
  };

  const handleQuickDecision = async (req: LeaveRequest, decision: 'Approved' | 'Rejected') => {
    try {
      const res = await api.reviewLeaveRequest(req.id, {
        status: decision,
        adminNotes: decision === 'Approved' ? 'Approved by Administrator' : 'Rejected by Administrator',
        reviewerName: currentUser?.name || 'System Administrator',
      });
      if (res.success && res.leaveRequest) {
        handleLeaveReviewed(res.leaveRequest);
      }
    } catch (err) {
      console.error('Quick decision error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto pb-12">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDirectory}
          className="flex items-center gap-2 text-[#64748b] hover:text-[#0f172a] text-[14px] font-medium cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Staff Directory</span>
        </button>

        <span className="text-[12px] font-mono text-[#64748b]">
          Verified by C++ WAL Storage
        </span>
      </div>

      {/* Main Staff Status Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#eff6ff] text-[#1d4ed8] font-bold text-[24px] flex items-center justify-center border-2 border-blue-100 shadow-sm">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-headline text-[24px] md:text-[28px] font-bold text-[#0f172a]">
                  {user.name}
                </h2>

                {/* Status Badge with color coding */}
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-mono font-bold border flex items-center gap-1.5 ${
                    user.status === 'Active'
                      ? 'bg-[#dcfce7] text-[#166534] border-green-200'
                      : user.status === 'Suspended'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.status === 'Active'
                        ? 'bg-emerald-500 animate-pulse'
                        : user.status === 'Suspended'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  STATUS: {user.status.toUpperCase()}
                </span>

                {/* Admin Quick Status Edit Button */}
                {isAdmin && user.role === 'Staff' && (
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(true)}
                    className="px-3 py-1 rounded-full text-[12px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Change status and notify staff member via email"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Change Status & Notify</span>
                  </button>
                )}
              </div>
              <p className="text-[14px] text-[#64748b] mt-1">
                {user.role} • Staff Identifier: <strong className="font-mono text-[#0f172a]">{user.staff_id}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748b]">
              Directory Security Role
            </span>
            <span className="font-headline text-[18px] font-bold text-[#1e40af]">
              {user.role === 'Admin' ? 'Sole Administrator' : 'Staff Member (Status View Only)'}
            </span>
          </div>
        </div>

        {/* Status Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span className="text-[11px] font-mono text-[#64748b] uppercase block mb-1">
              Email Address (Notification Target)
            </span>
            <span className="text-[14px] font-medium text-[#0f172a] break-all">
              {user.email}
            </span>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span className="text-[11px] font-mono text-[#64748b] uppercase block mb-1">
              Department Assignment
            </span>
            <span className="text-[14px] font-medium text-[#0f172a]">
              {user.department || 'Operations'}
            </span>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <span className="text-[11px] font-mono text-[#64748b] uppercase block mb-1">
              Primary Office Location
            </span>
            <span className="text-[14px] font-medium text-[#0f172a]">
              {user.location || 'Seattle HQ'}
            </span>
          </div>
        </div>

        {/* Security Rule Information Banner */}
        <div className="mt-8 p-5 bg-[#eff6ff] rounded-xl border border-[#bfdbfe] flex items-start gap-4">
          <span className="material-symbols-outlined text-[#2563eb] text-[24px] shrink-0 mt-0.5">
            shield_lock
          </span>
          <div className="text-[13px] text-[#1e3a8a] leading-relaxed">
            <h4 className="font-bold text-[14px] mb-1">
              {isSelf ? 'Your Account Permissions' : 'Staff Directory Policy'}
            </h4>
            <p>
              As configured in this Address Book system:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>The System Administrator can edit staff status</strong> between Active, Suspended, and Inactive.</li>
              <li>When the status is changed, an <strong>automated official notice is dispatched to the staff member's email</strong> ({user.email}).</li>
              <li>Staff members can log in using their email and password to securely <strong>view their verified status</strong> and records.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-[13px] font-medium shadow-2xs animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-emerald-600 text-[20px]">
            check_circle
          </span>
          <span>{notification}</span>
        </div>
      )}

      {/* Staff Leave Requests & Approvals Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">
                event_available
              </span>
              <span className="text-[12px] font-mono text-blue-700 font-bold uppercase tracking-wider">
                Absence & Time-Off Management
              </span>
            </div>
            <h3 className="font-headline text-[20px] md:text-[22px] font-bold text-slate-900">
              Staff Leave Requests & Admin Approvals
            </h3>
            <p className="text-[13px] text-slate-500">
              {isSelf
                ? 'Submit requests for taking leave with a full description. The System Administrator will accept or reject your request.'
                : `Review and decide on leave requests submitted by ${user.name}.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Request Leave</span>
          </button>
        </div>

        {/* Requests List */}
        {loadingLeaves ? (
          <div className="py-8 text-center text-slate-400 text-[13px]">
            Loading leave applications from C++ database...
          </div>
        ) : userLeaveRequests.length === 0 ? (
          <div className="py-10 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6">
            <span className="material-symbols-outlined text-slate-400 text-[32px] mb-2">
              calendar_today
            </span>
            <p className="text-[14px] font-medium text-slate-700">No Leave Requests on Record</p>
            <p className="text-[12px] text-slate-500 mt-1 max-w-sm">
              {isSelf
                ? 'You have not submitted any leave requests yet. Click "Request Leave" above to apply with dates and a description.'
                : `${user.name} has not submitted any leave applications.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userLeaveRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isRejected = req.status === 'Rejected';

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/15'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/15'
                      : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  {/* Top line: Reference + Dates + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {req.id}
                      </span>
                      <strong className="text-[14px] text-slate-900 font-bold">{req.leaveType}</strong>
                      <span className="text-[12px] text-slate-500 font-mono">
                        ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-mono text-slate-600">
                        {req.startDate} → {req.endDate}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-600'
                              : isRejected
                              ? 'bg-rose-600'
                              : 'bg-amber-600 animate-pulse'
                          }`}
                        />
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Description for the leave */}
                  <div className="mt-3">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                      Description for the Leave:
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 text-[13px] leading-relaxed">
                      {req.reason}
                    </div>
                  </div>

                  {/* Handover & Emergency Contact */}
                  {(req.handoverNotes || req.emergencyContact) && (
                    <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-slate-600">
                      {req.handoverNotes && (
                        <span>
                          <strong className="text-slate-500">Handover:</strong> {req.handoverNotes}
                        </span>
                      )}
                      {req.emergencyContact && (
                        <span>
                          <strong className="text-slate-500">Emergency Phone:</strong> {req.emergencyContact}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin Feedback Notes */}
                  {!isPending && (
                    <div
                      className={`mt-3 p-3 rounded-lg border text-[12px] ${
                        isApproved
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Decision: {req.status} by {req.reviewedBy || 'System Administrator'}</span>
                        {req.reviewedAt && (
                          <span className="text-[11px] font-normal text-slate-500">
                            {new Date(req.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {req.adminNotes && (
                        <p className="mt-1 italic text-slate-700">"{req.adminNotes}"</p>
                      )}
                    </div>
                  )}

                  {/* Admin Action Buttons if Pending (Accept or Reject by Admin) */}
                  {isAdmin && isPending && (
                    <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
                      <span className="text-[12px] text-amber-900 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[17px] text-amber-600">
                          pending_actions
                        </span>
                        <span>Administrator Decision Required:</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewingLeave(req)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                        >
                          Review & Add Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDecision(req, 'Rejected')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">cancel</span>
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDecision(req, 'Approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">check_circle</span>
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
      </div>

      {/* Edit Staff Status Modal */}
      {statusModalOpen && (
        <EditStaffStatusModal
          user={user}
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          onStatusUpdated={handleStatusUpdated}
          currentUser={currentUser}
        />
      )}

      {/* Request Leave Modal */}
      {requestModalOpen && (
        <RequestLeaveModal
          user={user}
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          onCreated={handleLeaveCreated}
        />
      )}

      {/* Review Leave Modal */}
      {reviewingLeave && (
        <ReviewLeaveModal
          leave={reviewingLeave}
          isOpen={!!reviewingLeave}
          onClose={() => setReviewingLeave(null)}
          onReviewed={handleLeaveReviewed}
          adminName={currentUser?.name || 'System Administrator'}
        />
      )}
    </div>
  );
};
