import React, { useState } from 'react';
import { User, LeaveType, LeaveRequest } from '../types';
import { api } from '../api';

interface RequestLeaveModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newRequest: LeaveRequest) => void;
}

const LEAVE_TYPES: LeaveType[] = [
  'Annual Leave',
  'Sick Leave',
  'Casual / Personal Leave',
  'Emergency Leave',
  'Maternity / Paternity Leave',
  'Bereavement Leave',
];

export const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({
  user,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(user.phone || '');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate business / calendar days
  const calculateDays = () => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
      const diff = e.getTime() - s.getTime();
      if (diff < 0) return 0;
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    } catch {
      return 1;
    }
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a description for the leave.');
      return;
    }
    if (daysCount <= 0) {
      setError('End date must be on or after start date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createLeaveRequest({
        userId: user.id,
        staffId: user.staff_id || 'STF-TEMP',
        staffName: user.name,
        staffEmail: user.email,
        department: user.department || 'Operations',
        leaveType,
        startDate,
        endDate,
        totalDays: daysCount,
        reason: reason.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
        handoverNotes: handoverNotes.trim() || undefined,
      });

      if (!res.success || !res.leaveRequest) {
        throw new Error(res.error || 'Failed to submit leave request');
      }

      onCreated(res.leaveRequest);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error submitting leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[12px] font-mono text-blue-700 font-bold uppercase tracking-wider">
                Staff Leave Application
              </span>
            </div>
            <h3 className="font-headline text-[20px] font-bold text-slate-900">
              Request Time Off / Leave of Absence
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Submitting for: <strong className="text-slate-800">{user.name}</strong> ({user.staff_id})
            </p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Leave Type */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Leave Category / Type <span className="text-red-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duration Indicator */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[12px] text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
              <span>Calculated Leave Period:</span>
            </span>
            <strong className="font-mono text-[13px]">
              {daysCount} Day{daysCount !== 1 ? 's' : ''}
            </strong>
          </div>

          {/* Description for the leave - REQUIRED FIELD requested by the user */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-slate-800">
                Description for the Leave <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Required</span>
            </div>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed description for taking leave (e.g. medical reason, family event, personal travel, or emergency necessity)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This description will be reviewed by the System Administrator to evaluate approval or rejection.
            </p>
          </div>

          {/* Handover Coverage Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Handover Coverage / Delegation Notes (Optional)
            </label>
            <input
              type="text"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Alex Rivera covering operational tasks & ticket triage"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Emergency Contact Phone / Alternative (Optional)
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{submitting ? 'Submitting...' : 'Submit Leave Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
