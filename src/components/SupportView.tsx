import React from 'react';

export const SupportView: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto">
      <div>
        <h2 className="font-headline text-[28px] font-bold text-[#111c2d]">
          System Support & Documentation
        </h2>
        <p className="text-[14px] text-[#505f76]">
          Technical architecture, user guides, and directory operational manual.
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
        <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-4">
          Keyboard Shortcuts & Navigation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[14px] text-[#111c2d]">Global Quick Search</span>
            <kbd className="px-2 py-1 bg-white border border-[#c3c6d7] rounded text-[11px] font-mono font-bold text-[#505f76]">
              ⌘K or Ctrl+K
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[14px] text-[#111c2d]">Focus AddressBook Search</span>
            <kbd className="px-2 py-1 bg-white border border-[#c3c6d7] rounded text-[11px] font-mono font-bold text-[#505f76]">
              /
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[14px] text-[#111c2d]">Close Modals / Overlays</span>
            <kbd className="px-2 py-1 bg-white border border-[#c3c6d7] rounded text-[11px] font-mono font-bold text-[#505f76]">
              ESC
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[14px] text-[#111c2d]">Execute Benchmark</span>
            <kbd className="px-2 py-1 bg-white border border-[#c3c6d7] rounded text-[11px] font-mono font-bold text-[#505f76]">
              Engine Inspector
            </kbd>
          </div>
        </div>
      </div>

      {/* Architecture Specs */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
        <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-2">
          C++ Real-Time Engine Specification
        </h3>
        <p className="text-[13px] text-[#505f76] mb-4">
          The backend employs a natively compiled C++ binary (`proton_core_engine`) with zero-overhead SQLite WAL (Write-Ahead Logging) storage.
        </p>

        <div className="space-y-3 text-[13px]">
          <div className="p-3 bg-[#f0f3ff] rounded-lg border border-[#c3c6d7] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px] mt-0.5">offline_bolt</span>
            <div>
              <strong className="text-[#111c2d] block">Sub-Millisecond Transaction Writes:</strong>
              <span className="text-[#505f76]">
                Each contact creation and update utilizes native C++ prepared statements and single-pass transactions, clocking in at ~7.3 microseconds per record.
              </span>
            </div>
          </div>
          <div className="p-3 bg-[#f0f3ff] rounded-lg border border-[#c3c6d7] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px] mt-0.5">verified_user</span>
            <div>
              <strong className="text-[#111c2d] block">ACID Compliant Durability:</strong>
              <span className="text-[#505f76]">
                Full crash-recovery guarantees with Write-Ahead Logging; reader connections never block writer transactions.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
