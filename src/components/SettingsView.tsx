import React, { useState } from 'react';
import { EngineStatus, Contact } from '../types';

interface SettingsViewProps {
  engineStatus: EngineStatus | null;
  contacts: Contact[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ engineStatus, contacts }) => {
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'proton_address_directory.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSavedNotice('Directory exported as JSON');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = ['id', 'name', 'email', 'phone', 'category', 'job_title', 'address', 'is_key_account'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      c.category,
      `"${(c.job_title || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.is_key_account,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', 'proton_address_directory.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSavedNotice('Directory exported as CSV');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto">
      <div>
        <h2 className="font-headline text-[28px] font-bold text-[#111c2d]">
          Directory Settings
        </h2>
        <p className="text-[14px] text-[#505f76]">
          Configure administrator preferences, backup routines, and storage parameters.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[14px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Admin Profile */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
        <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-4 pb-2 border-b border-[#f0f3ff]">
          Administrator Profile
        </h3>
        <div className="flex items-center gap-4">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDakgg3Ty-CzCpN6-y87GnCZF7j-kdb0fCNLsob-L8z1u8q7IVBrULwsBrCL6ehke0rrdl4KGWg7gOqSzynqPys0yPKzEe4JvKutthfFvj_-ve_3h-xizA21yKXzsbk5e834xR6BbYIA6tTOCgDdlimOYH8v9FXy3-sLphg3OzJ2gA5nnEk5YbKqUhSkOfHJ7rISByHGGOc2q2N9V4RSBqz-U1kVLFh3O8oaJlabwfS7pLM7Zt6cfoA"
            alt="Admin Avatar"
            className="w-16 h-16 rounded-full object-cover border border-[#c3c6d7]"
          />
          <div>
            <h4 className="font-headline text-[16px] font-bold text-[#111c2d]">
              System Admin
            </h4>
            <p className="text-[13px] text-[#505f76]">kanithisaikiran3036@gmail.com</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#dee8ff] text-[#004ac6]">
              SUPER ADMIN • FULL ACCESS
            </span>
          </div>
        </div>
      </div>

      {/* Database Backup & Export */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
        <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-2">
          Backup & Data Portability
        </h3>
        <p className="text-[13px] text-[#505f76] mb-4">
          Export full contact lists directly from the C++ SQLite WAL database.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-[#f0f3ff] text-[#004ac6] border border-[#c3c6d7] rounded-lg text-[13px] font-medium hover:bg-[#d0e1fb] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export as JSON</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#f0f3ff] text-[#004ac6] border border-[#c3c6d7] rounded-lg text-[13px] font-medium hover:bg-[#d0e1fb] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            <span>Export as CSV</span>
          </button>
        </div>
      </div>

      {/* Engine Diagnostics */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
        <h3 className="font-headline text-[18px] font-bold text-[#111c2d] mb-2">
          C++ Backend Connector Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[13px]">
          <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[11px] font-mono text-[#505f76] block">ENGINE VERSION</span>
            <span className="font-bold text-[#111c2d]">{engineStatus?.engine_version || 'v2.4.1'}</span>
          </div>
          <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[11px] font-mono text-[#505f76] block">COMPILER</span>
            <span className="font-bold text-[#111c2d]">GCC 12.3.0</span>
          </div>
          <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[11px] font-mono text-[#505f76] block">JOURNAL</span>
            <span className="font-bold text-emerald-600">WAL ACTIVE</span>
          </div>
          <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#c3c6d7]">
            <span className="text-[11px] font-mono text-[#505f76] block">CACHE POOL</span>
            <span className="font-bold text-[#111c2d]">64 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
