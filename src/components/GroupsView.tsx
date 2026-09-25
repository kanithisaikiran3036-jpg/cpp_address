import React, { useState } from 'react';
import { Contact } from '../types';

interface GroupsViewProps {
  contacts: Contact[];
  onSelectContact: (id: string) => void;
  onAddNewContact: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  contacts,
  onSelectContact,
  onAddNewContact,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  const groups = [
    { name: 'Clients', icon: 'business_center', desc: 'Active client accounts and partners' },
    { name: 'Vendors', icon: 'store', desc: 'Hardware, infrastructure & service providers' },
    { name: 'Partners', icon: 'handshake', desc: 'Strategic global alliance relationships' },
    { name: 'Internal', icon: 'domain', desc: 'System operators and engineering personnel' },
    { name: 'Personal', icon: 'person', desc: 'Personal network and individual contacts' },
    { name: 'Work', icon: 'work', desc: 'Work colleagues and project collaborators' },
    { name: 'Key Accounts', icon: 'star', desc: 'High-priority executive tier accounts' },
  ];

  const getGroupCount = (groupName: string) => {
    if (groupName === 'Key Accounts') {
      return contacts.filter((c) => c.is_key_account === 1).length;
    }
    return contacts.filter((c) => c.category === groupName).length;
  };

  const filteredContacts = contacts.filter((c) => {
    if (selectedGroup === 'All') return true;
    if (selectedGroup === 'Key Accounts') return c.is_key_account === 1;
    return c.category === selectedGroup;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline text-[28px] font-bold text-[#111c2d]">
            Directory Groups
          </h2>
          <p className="text-[14px] text-[#505f76]">
            Organize and segment contacts across departmental cohorts.
          </p>
        </div>
        <button
          onClick={onAddNewContact}
          className="px-4 py-2 bg-[#004ac6] text-white text-[14px] font-medium rounded-lg hover:bg-[#003ea8] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">group_add</span>
          <span>Add Contact to Group</span>
        </button>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((grp) => {
          const count = getGroupCount(grp.name);
          const isSelected = selectedGroup === grp.name;
          return (
            <div
              key={grp.name}
              onClick={() => setSelectedGroup(isSelected ? 'All' : grp.name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-[#d0e1fb] border-[#004ac6] ring-1 ring-[#004ac6]'
                  : 'bg-white border-[#c3c6d7] hover:border-[#004ac6]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-[24px] text-[#004ac6]">
                  {grp.icon}
                </span>
                <span className="font-mono text-[12px] bg-[#f0f3ff] text-[#004ac6] px-2 py-0.5 rounded font-bold">
                  {count} members
                </span>
              </div>
              <h3 className="font-headline text-[16px] font-bold text-[#111c2d]">
                {grp.name}
              </h3>
              <p className="text-[12px] text-[#505f76] mt-1 line-clamp-2">
                {grp.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Group Filter Bar */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#c3c6d7] bg-[#f9f9ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">group</span>
            <span className="font-headline text-[16px] font-semibold text-[#111c2d]">
              {selectedGroup === 'All' ? 'All Groups Contacts' : `${selectedGroup} Contacts`}
            </span>
            <span className="text-[12px] font-mono text-[#505f76]">
              ({filteredContacts.length} contacts)
            </span>
          </div>
          {selectedGroup !== 'All' && (
            <button
              onClick={() => setSelectedGroup('All')}
              className="text-[12px] text-[#004ac6] hover:underline font-medium cursor-pointer"
            >
              Show All Groups
            </button>
          )}
        </div>

        <div className="divide-y divide-[#c3c6d7]/50">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-[#505f76] text-[14px]">
              No contacts in this group yet.
            </div>
          ) : (
            filteredContacts.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectContact(c.id)}
                className="p-3.5 hover:bg-[#f0f3ff] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#dbe1ff] text-[#00174b] font-bold text-[12px] flex items-center justify-center">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-[#111c2d]">{c.name}</span>
                    <span className="text-[12px] text-[#505f76] ml-2">
                      {c.job_title || c.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-[#505f76]">{c.phone}</span>
                  <span className="material-symbols-outlined text-[#737686] text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
