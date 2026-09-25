import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveTab } from '../types';

interface TopNavBarProps {
  pageTitle: string;
  currentUser: User | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  pageTitle,
  currentUser,
  onOpenMobileMenu,
  onLogout,
  onOpenLoginModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'SA';

  return (
    <header className="bg-white border-b border-[#e5e7eb] flex justify-between items-center h-16 px-4 md:px-8 w-full sticky top-0 z-30">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          type="button"
          className="md:hidden text-[#64748b] p-1.5 -ml-1 rounded-lg hover:bg-[#f8fafc] cursor-pointer"
          aria-label="Open Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <h1 className="font-headline text-[22px] font-bold text-[#0f172a] tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* User Info / Dropdown matching Screenshot 1 & 2 */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#f8fafc] transition-colors cursor-pointer group"
        >
          {/* Avatar Circle */}
          <div className="w-9 h-9 rounded-full bg-[#dbeafe] text-[#1e40af] font-semibold text-[13px] flex items-center justify-center shrink-0 border border-[#bfdbfe]">
            {initials}
          </div>

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[14px] font-semibold text-[#0f172a] leading-tight">
              {currentUser?.name || 'System Administrator'}
            </span>
            <span className="text-[12px] text-[#64748b]">
              {currentUser?.role || 'Admin'}
            </span>
          </div>

          {/* Dropdown chevron */}
          <span className="material-symbols-outlined text-[18px] text-[#64748b] group-hover:text-[#0f172a] transition-transform">
            {dropdownOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-2 z-50 text-[13px]">
            <div className="px-4 py-3 border-b border-[#f1f5f9]">
              <p className="font-semibold text-[#0f172a] text-[14px]">{currentUser?.name}</p>
              <p className="text-[12px] text-[#64748b] truncate">{currentUser?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#dbeafe] text-[#1e40af]">
                  {currentUser?.role === 'Admin' ? 'SOLE ADMINISTRATOR' : `STAFF (${currentUser?.staff_id})`}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">● Authenticated</span>
              </div>
            </div>

            {/* Direct Switch Disabled Security Notice */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 leading-snug flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 mt-0.5">
                verified_user
              </span>
              <span>
                Direct account switching is disabled for security compliance. Users must authenticate with individual credentials.
              </span>
            </div>

            <div className="mt-1 pt-1 px-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full text-left px-3 py-2 text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-colors flex items-center gap-2 font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                <span>Switch Account (Requires Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 text-[#ef4444] hover:bg-[#fef2f2] rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
