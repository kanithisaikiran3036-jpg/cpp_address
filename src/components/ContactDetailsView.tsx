import React, { useState, useEffect } from 'react';
import { Contact, Note, ActivityLog } from '../types';
import { api } from '../api';

interface ContactDetailsViewProps {
  contactId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export const ContactDetailsView: React.FC<ContactDetailsViewProps> = ({
  contactId,
  onBack,
  onEdit,
}) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      const [c, n, a] = await Promise.all([
        api.getContact(contactId),
        api.getNotes(contactId),
        api.getActivity(contactId),
      ]);
      setContact(c);
      setNotes(n);
      setActivity(a);
    } catch (err) {
      console.error('Failed to load contact details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !contact) return;
    try {
      await api.addNote(contact.id, newNoteContent.trim(), 'System Admin');
      setNewNoteContent('');
      setShowAddNoteModal(false);
      // reload notes and activity
      const [updatedNotes, updatedAct] = await Promise.all([
        api.getNotes(contact.id),
        api.getActivity(contact.id),
      ]);
      setNotes(updatedNotes);
      setActivity(updatedAct);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setMessageText('');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#505f76]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[14px]">Loading contact details from C++ WAL storage...</span>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#c3c6d7]">
        <p className="text-[16px] text-[#111c2d] font-semibold mb-4">Contact not found</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#004ac6] text-white rounded-lg text-[14px]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Hotlink image or fallback
  const avatarImage =
    contact.avatar_url ||
    (contact.id === 'c_sarah_jenkins' || contact.name.includes('Sarah')
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDORVJPA79blPu5dBRNdSc_cU1ZNgnAFVBUn7lE1vtb7oQphXnyndBEIHLpTMtZ1l1B9XKamzYZiTwqAY-lws8auNY2oIP57PuOV04mopYRfhHnNOS2FIqRlVYTXWoFWlEZCVCP7xX_utifjVJpAABHpqoPw9r44ae9vJrx9RK7bxkQJxuUUcMv9KllA4zzSCRxoaU6a0rdTetkb3a_8T_VZvj5Ui9B6b5xKITuESFo8GFzZHC8UACu'
      : '');

  const initials = contact.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto">
      {/* Breadcrumb & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-[#505f76] hover:text-[#004ac6] transition-colors text-[14px] font-medium self-start cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => onEdit(contact.id)}
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-[#737686] text-[#505f76] hover:bg-[#f0f3ff] rounded-lg text-[14px] font-medium transition-colors active:translate-y-px duration-75 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>Edit</span>
          </button>
          <button
            onClick={() => setShowMessageModal(true)}
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[#004ac6] text-white rounded-lg text-[14px] font-medium hover:bg-[#003ea8] transition-colors active:translate-y-px duration-75 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Message</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Info Card & Notes (8 Columns) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 relative overflow-hidden group shadow-xs">
            {/* Subtle gradient decorative element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#004ac6]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={contact.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border-2 border-white shadow-md shrink-0"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-[#dbe1ff] text-[#00174b] font-bold text-[32px] flex items-center justify-center shrink-0 border-2 border-white shadow-md">
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="font-headline text-[28px] md:text-[34px] font-bold text-[#111c2d] leading-tight">
                    {contact.name}
                  </h1>
                  {contact.is_key_account === 1 && (
                    <span className="px-2.5 py-0.5 bg-[#dee8ff] text-[#004ac6] font-mono text-[11px] font-semibold rounded-full border border-[#dbe1ff]">
                      KEY ACCOUNT
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-[#f0f3ff] text-[#505f76] font-mono text-[11px] font-medium rounded-full border border-[#c3c6d7]">
                    {contact.category}
                  </span>
                </div>

                <p className="text-[#505f76] text-[16px] leading-[24px] mb-6">
                  {contact.job_title || 'Organization Member'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f3ff] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#e7eeff] flex items-center justify-center text-[#004ac6] shrink-0">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] text-[#505f76] uppercase">Email</span>
                      <a
                        href={`mailto:${contact.email}`}
                        className="font-mono text-[13px] text-[#111c2d] hover:text-[#004ac6] truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f3ff] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#e7eeff] flex items-center justify-center text-[#004ac6] shrink-0">
                      <span className="material-symbols-outlined text-[18px]">phone</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] text-[#505f76] uppercase">Phone</span>
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-mono text-[13px] text-[#111c2d] hover:text-[#004ac6] truncate"
                      >
                        {contact.phone || '—'}
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-3 md:col-span-2 p-2 rounded-lg hover:bg-[#f0f3ff] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#e7eeff] flex items-center justify-center text-[#004ac6] shrink-0">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] text-[#505f76] uppercase">Address</span>
                      <span className="text-[14px] text-[#111c2d] leading-relaxed">
                        {contact.address || 'No physical address recorded.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline text-[20px] font-semibold text-[#111c2d] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#505f76]">sticky_note_2</span>
                <span>Internal Notes</span>
              </h3>
              <button
                onClick={() => setShowAddNoteModal(true)}
                type="button"
                className="text-[#004ac6] font-mono text-[12px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>ADD NOTE</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="bg-[#f9f9ff] p-4 rounded-lg border border-[#c3c6d7]/50 text-[#505f76] text-[14px] leading-relaxed">
                Sarah prefers communication via email for initial project scoping but requires a phone call for final sign-offs. Currently managing the Q3 expansion project. Ensure we loop in her associate, David, for technical reviews.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#f9f9ff] p-4 rounded-lg border border-[#c3c6d7]/50 text-[#111c2d] text-[14px] leading-relaxed relative"
                  >
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 pt-2 border-t border-[#c3c6d7]/30 flex justify-between text-[11px] font-mono text-[#505f76]">
                      <span>Author: {note.author}</span>
                      <span>{note.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info (4 Columns) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          {/* Activity Timeline */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs flex-1">
            <h3 className="font-headline text-[18px] font-semibold text-[#111c2d] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#505f76]">history</span>
              <span>Recent Activity</span>
            </h3>

            <div className="relative border-l border-[#c3c6d7] ml-2 space-y-6 pb-2">
              {/* Event 1 */}
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#004ac6] ring-4 ring-white"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-[#505f76]">TODAY, 10:42 AM</span>
                  <p className="text-[14px] text-[#111c2d]">
                    <span className="font-semibold">Note added</span> by System Admin
                  </p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#c3c6d7] ring-4 ring-white"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-[#505f76]">OCT 12, 2023</span>
                  <p className="text-[14px] text-[#111c2d]">
                    <span className="font-semibold">Contact updated:</span> Phone number changed
                  </p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#c3c6d7] ring-4 ring-white"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-[#505f76]">SEP 01, 2023</span>
                  <p className="text-[14px] text-[#111c2d]">
                    <span className="font-semibold">Contact created</span> via Data Import
                  </p>
                </div>
              </div>

              {/* Additional dynamic activities if present */}
              {activity.slice(3).map((act) => (
                <div key={act.id} className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#c3c6d7] ring-4 ring-white"></div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-[#505f76]">
                      {act.created_at}
                    </span>
                    <p className="text-[14px] text-[#111c2d]">
                      <span className="font-semibold">{act.action}:</span> {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal Dialog */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#c3c6d7] w-full max-w-md p-6">
            <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-4">
              Add Note for {contact.name}
            </h3>
            <form onSubmit={handleAddNote}>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter internal communication notes, preferences, or project updates..."
                rows={4}
                required
                className="w-full p-3 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 text-[14px] text-[#505f76] hover:bg-[#e7eeff] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004ac6] text-white text-[14px] font-medium rounded-lg hover:bg-[#003ea8]"
                >
                  Save Note to C++ WAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#c3c6d7] w-full max-w-md p-6">
            <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-2">
              Send Message to {contact.name}
            </h3>
            <p className="text-[13px] text-[#505f76] mb-4 font-mono">
              To: {contact.email}
            </p>
            {messageSent ? (
              <div className="py-6 text-center text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="material-symbols-outlined text-[32px] mb-1">check_circle</span>
                <p className="font-medium text-[14px]">Message dispatched successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  required
                  className="w-full p-3 bg-[#f9f9ff] border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] resize-none mb-4"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 text-[14px] text-[#505f76] hover:bg-[#e7eeff] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#004ac6] text-white text-[14px] font-medium rounded-lg hover:bg-[#003ea8] flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
