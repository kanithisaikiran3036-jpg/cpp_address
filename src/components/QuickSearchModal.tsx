import React, { useState, useEffect, useRef } from 'react';
import { Contact, ActiveTab } from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSelectContact: (id: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSelectContact,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.job_title && c.job_title.toLowerCase().includes(q)) ||
      (c.tags && c.tags.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#c3c6d7] overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#c3c6d7] bg-[#f9f9ff]">
          <span className="material-symbols-outlined text-[#004ac6] mr-3 text-[22px]">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name, email, phone, category..."
            className="flex-1 bg-transparent text-[15px] text-[#111c2d] placeholder:text-[#737686] outline-none"
          />
          <button
            onClick={onClose}
            className="text-[11px] font-mono text-[#505f76] bg-[#e7eeff] px-2 py-0.5 rounded border border-[#c3c6d7]"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-[#c3c6d7]/40">
          {/* Quick actions if query is empty */}
          {query.trim() === '' && (
            <div className="pb-2 mb-2">
              <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[#505f76]">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1 px-1">
                <button
                  type="button"
                  onClick={() => { onNavigate('dashboard'); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#e7eeff] text-[#111c2d] text-[13px] text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">dashboard</span>
                  <span>Dashboard Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('add-contact'); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#e7eeff] text-[#111c2d] text-[13px] text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">person_add</span>
                  <span>Add New Contact</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('analytics'); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#e7eeff] text-[#111c2d] text-[13px] text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">analytics</span>
                  <span>Analytics & Insights</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('engine-inspector'); onClose(); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#e7eeff] text-[#111c2d] text-[13px] text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">memory</span>
                  <span>C++ Core Benchmark</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-1">
            <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[#505f76] flex justify-between">
              <span>Matching Contacts</span>
              <span>{filtered.length} found</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-8 text-center text-[#505f76] text-[14px]">
                No contacts matching "{query}"
              </div>
            ) : (
              filtered.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    onSelectContact(contact.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f0f3ff] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#dbe1ff] text-[#00174b] font-bold text-[12px] flex items-center justify-center shrink-0">
                      {contact.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-[#111c2d] truncate flex items-center gap-2">
                        <span>{contact.name}</span>
                        {contact.is_key_account === 1 && (
                          <span className="text-[10px] bg-[#dee8ff] text-[#004ac6] px-1.5 py-0.2 rounded font-mono">
                            KEY
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#505f76] truncate flex items-center gap-2">
                        <span>{contact.email}</span>
                        <span>•</span>
                        <span className="font-mono">{contact.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#d0e1fb] text-[#54647a]">
                      {contact.category}
                    </span>
                    <span className="material-symbols-outlined text-[#737686] text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#f0f3ff] border-t border-[#c3c6d7] text-[11px] text-[#505f76] flex items-center justify-between font-mono">
          <span>Proton C++ Real-Time Index</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
