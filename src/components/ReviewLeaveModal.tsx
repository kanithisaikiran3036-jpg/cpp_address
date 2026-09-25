import React, { useState } from 'react';
import { LeaveRequest } from '../types';
import { api } from '../api';

interface ReviewLeaveModalProps {
  leave: LeaveRequest;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: (updatedLeave: LeaveRequest) => void;
  adminName?: string;
}

export const ReviewLeaveModal: React.FC<ReviewLeaveModalProps> = ({
  leave,
  isOpen,
  onClose,
  onReviewed,
  adminName = 'System Administrator',
}) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecision = async (status: 'Approved' | 'Rejected') => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.reviewLeaveRequest(leave.id, {
        status,
        adminNotes: adminNotes.trim() || undefined,
        reviewerName: adminName,
      });

      if (!res.success || !res.leaveRequest) {
        throw new Error(res.error || `Failed to ${status.toLowerCase()} leave request`);
      }

      onReviewed(res.leaveRequest);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {leave.id}
              </span>
              <span className="text-[12px] text-slate-500 font-mono">
                {leave.leaveType}
              </span>
            </div>
            <h3 className="font-headline text-[20px] font-bold text-slate-900">
              Review Staff Leave Request
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Staff & Leave Request Summary */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-3 text-[13px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <div>
              <strong className="text-slate-900 text-[14px] block">{leave.staffName}</strong>
              <span className="text-slate-500 text-[12px]">{leave.staffEmail} • {leave.staffId}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {leave.department}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <span className="text-slate-500 block">Duration / Dates:</span>
              <strong className="text-slate-800 font-mono">
                {leave.startDate} → {leave.endDate}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Total Days Requested:</span>
              <strong className="text-slate-800 font-mono text-[13px]">
                {leave.totalDays} business day{leave.totalDays > 1 ? 's' : ''}
              </strong>
            </div>
          </div>

          {/* Description for the leave */}
          <div className="pt-2 border-t border-slate-200/70">
            <span className="text-slate-500 font-semibold block mb-1 text-[11px] uppercase tracking-wider">
              Staff Leave Description / Reason:
            </span>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-sans text-[13px]">
              {leave.reason}
            </div>
          </div>

          {leave.handoverNotes && (
            <div className="text-[12px]">
              <span className="text-slate-500 font-medium">Handover Coverage: </span>
              <span className="text-slate-700">{leave.handoverNotes}</span>
            </div>
          )}

          {leave.emergencyContact && (
            <div className="text-[12px]">
              <span className="text-slate-500 font-medium">Emergency Contact: </span>
              <span className="text-slate-700 font-mono">{leave.emergencyContact}</span>
            </div>
          )}
        </div>

        {/* Administrator Decision Notes Input */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
            Admin Feedback / Decision Note (Optional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            placeholder="Add comments or instructions (e.g. 'Approved. Ensure handovers with team are complete before Friday')..."
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            This note will be recorded and dispatched via official email notification to <strong>{leave.staffEmail}</strong>.
          </p>
        </div>

        {/* Action Buttons: Accept / Reject */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Reject Button */}
            <button
              type="button"
              onClick={() => handleDecision('Rejected')}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Reject Leave</span>
            </button>

            {/* Accept / Approve Button */}
            <button
              type="button"
              onClick={() => handleDecision('Approved')}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Accept & Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
