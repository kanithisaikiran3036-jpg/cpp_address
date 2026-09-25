import React, { useState } from 'react';
import { User, DispatchedEmail } from '../types';
import { api } from '../api';

interface EditStaffStatusModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedUser: User) => void;
  currentUser: User | null;
}

export const EditStaffStatusModal: React.FC<EditStaffStatusModalProps> = ({
  user,
  isOpen,
  onClose,
  onStatusUpdated,
  currentUser,
}) => {
  if (!isOpen || !user) return null;

  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'Inactive' | 'Suspended'>(
    user.status || 'Active'
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dispatchedEmail, setDispatchedEmail] = useState<DispatchedEmail | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      setErrorMsg('Unauthorized: Only the System Administrator can modify staff status.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.updateStaffStatus(
        user.id,
        selectedStatus,
        reason.trim(),
        currentUser.id
      );

      if (res.success && res.user) {
        // Fetch the generated notification email for live in-app inspection
        const latestMail = await api.getLatestEmail(user.email);
        if (latestMail) {
          setDispatchedEmail(latestMail);
        }
        onStatusUpdated(res.user);
      } else {
        setErrorMsg(res.error || 'Failed to update staff status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating staff status in C++ backend');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: {
    value: 'Active' | 'Suspended' | 'Inactive';
    label: string;
    description: string;
    icon: string;
    badgeStyle: string;
    cardBorder: string;
  }[] = [
    {
      value: 'Active',
      label: 'Active',
      description: 'Standard active access. Staff member has full operational permissions.',
      icon: 'check_circle',
      badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cardBorder: 'hover:border-emerald-500 has-checked:border-emerald-600 has-checked:bg-emerald-50/50',
    },
    {
      value: 'Suspended',
      label: 'Suspended',
      description: 'Access temporarily on hold. System privileges restricted pending clearance.',
      icon: 'warning',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
      cardBorder: 'hover:border-amber-500 has-checked:border-amber-600 has-checked:bg-amber-50/50',
    },
    {
      value: 'Inactive',
      label: 'Inactive',
      description: 'Archived staff profile. Marked as inactive for current operations.',
      icon: 'remove_circle_outline',
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
      cardBorder: 'hover:border-slate-500 has-checked:border-slate-600 has-checked:bg-slate-50',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
              </div>
              <div>
                <h3 className="font-headline text-[18px] font-bold text-slate-900 leading-tight">
                  Edit Staff Status
                </h3>
                <p className="text-[12px] text-slate-500">
                  Updates record in SQLite WAL & dispatches automated email notice
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] block">close</span>
            </button>
          </div>

          {/* Success state with Email inspection */}
          {dispatchedEmail ? (
            <div className="py-2 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[24px] shrink-0 mt-0.5">
                  mark_email_read
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-[14px] text-emerald-950">
                    Status Updated & Email Dispatched!
                  </h4>
                  <p className="text-[12px] text-emerald-800 mt-0.5 leading-relaxed">
                    <strong>{user.name}</strong> is now marked as{' '}
                    <span className="font-bold uppercase">{selectedStatus}</span>. A formal
                    notification email was sent to <strong className="font-mono">{user.email}</strong>.
                  </p>
                </div>
              </div>

              {/* Email summary card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient Email:</span>
                  <span className="font-mono font-medium text-slate-900">{dispatchedEmail.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Subject:</span>
                  <span className="font-medium text-slate-900">{dispatchedEmail.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispatched At:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(dispatchedEmail.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(true)}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[13px] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>View Dispatched Email</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Staff Member Info Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-[12px] flex items-center justify-center">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-slate-900">{user.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {user.staff_id} • {user.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">CURRENT STATUS</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-200 text-slate-800">
                    {user.status}
                  </span>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-[13px] border border-red-200 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Status Radio Options: Active, Suspended, Inactive */}
              <div>
                <label className="text-[13px] font-semibold text-slate-800 block mb-2">
                  Select New Staff Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {statusOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                        selectedStatus === opt.value
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staff_status"
                        value={opt.value}
                        checked={selectedStatus === opt.value}
                        onChange={() => setSelectedStatus(opt.value)}
                        className="mt-1 w-4 h-4 text-indigo-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <strong className="text-[13px] text-slate-900 flex items-center gap-1.5 font-bold">
                            <span
                              className={`material-symbols-outlined text-[17px] ${
                                opt.value === 'Active'
                                  ? 'text-emerald-600'
                                  : opt.value === 'Suspended'
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {opt.icon}
                            </span>
                            {opt.label}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${opt.badgeStyle}`}
                          >
                            {opt.value.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 leading-normal">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Administrative Reason / Note for Email */}
              <div>
                <label className="text-[13px] font-semibold text-slate-800 block mb-1">
                  Reason for Status Change <span className="text-slate-400 font-normal">(Included in Staff Email)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual clearance review, role reassignment, or temporary leave"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Automated Email Notice */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-[12px] text-blue-900 leading-relaxed">
                <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0 mt-0.5">
                  outgoing_mail
                </span>
                <div>
                  <strong className="block font-semibold">Automated Email Notification:</strong>
                  Saving will immediately dispatch an official notification email to{' '}
                  <span className="font-mono font-bold text-blue-950 underline">{user.email}</span>{' '}
                  notifying them that their status is now <strong>{selectedStatus}</strong>.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 h-11 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating & Sending Mail...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Update Status & Notify Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Dispatched Email Full View Modal */}
      {showEmailPreview && dispatchedEmail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden animate-fadeIn text-slate-900">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">
                  mark_email_read
                </span>
                <span className="font-semibold text-[14px]">Status Notification Email Inspector</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px] block">close</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 text-[12px] space-y-1">
              <div>
                <span className="font-semibold text-slate-500">To: </span>
                <span className="font-mono text-slate-900 font-medium">{dispatchedEmail.to}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Subject: </span>
                <span className="text-slate-900 font-medium">{dispatchedEmail.subject}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Sent: </span>
                <span className="text-slate-600 font-mono">
                  {new Date(dispatchedEmail.sentAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: dispatchedEmail.html }}
                className="text-[13px]"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[13px] font-medium cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
