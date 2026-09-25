import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { api } from '../api';

interface ArchiveViewProps {
  onSelectContact: (id: string) => void;
  onRefreshAll: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  onSelectContact,
  onRefreshAll,
}) => {
  const [archivedContacts, setArchivedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArchived = async () => {
    try {
      setLoading(true);
      const res = await api.getContacts({ archived: 1, limit: 100 });
      setArchivedContacts(res.items || []);
    } catch (err) {
      console.error('Failed to load archived contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, []);

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleArchive(id, false);
      await loadArchived();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to restore contact:', err);
    }
  };

  const handlePermanentDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete "${name}" from C++ SQLite database? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteContact(id);
      await loadArchived();
      onRefreshAll();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto">
      <div>
        <h2 className="font-headline text-[28px] font-bold text-[#111c2d]">
          Archived Contacts
        </h2>
        <p className="text-[14px] text-[#505f76]">
          Deactivated records preserved in high-performance storage.
        </p>
      </div>

      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#c3c6d7] bg-[#f9f9ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#505f76]">archive</span>
            <span className="font-headline text-[16px] font-semibold text-[#111c2d]">
              Archive Storage
            </span>
          </div>
          <span className="font-mono text-[12px] text-[#505f76]">
            {archivedContacts.length} records in archive
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#505f76] text-[14px]">
            Retrieving archived records from C++ WAL storage...
          </div>
        ) : archivedContacts.length === 0 ? (
          <div className="p-12 text-center text-[#505f76] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#737686]">inventory_2</span>
            <p className="text-[15px] font-medium text-[#111c2d]">No contacts in archive</p>
            <p className="text-[13px] text-[#505f76]">
              Archived contacts will appear here and can be restored anytime.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#c3c6d7]/50">
            {archivedContacts.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectContact(c.id)}
                className="p-4 hover:bg-[#f0f3ff] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#dee8ff] text-[#505f76] font-bold text-[12px] flex items-center justify-center">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#111c2d]">{c.name}</p>
                    <p className="text-[12px] text-[#505f76]">
                      {c.email} • {c.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleRestore(c.id, e)}
                    className="px-3 py-1.5 bg-[#e7eeff] text-[#004ac6] hover:bg-[#d0e1fb] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Restore to Active Directory"
                  >
                    <span className="material-symbols-outlined text-[16px]">unarchive</span>
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={(e) => handlePermanentDelete(c.id, c.name, e)}
                    className="px-3 py-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Permanently Delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
