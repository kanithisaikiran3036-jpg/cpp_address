import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { api } from '../api';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    api.getActivity().then(setLogs);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto pb-12">
      <div>
        <h2 className="font-headline text-[26px] font-bold text-[#0f172a]">
          Activity Logs
        </h2>
        <p className="text-[14px] text-[#64748b]">
          Real-time security audit trails and directory operations recorded by the C++ engine.
        </p>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#f1f5f9] bg-[#f8fafc] flex justify-between items-center text-[12px] font-mono text-[#64748b]">
          <span>Audit Event Log</span>
          <span>Immutable WAL Entries</span>
        </div>

        <div className="divide-y divide-[#f1f5f9]">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-[#f8fafc] transition-colors">
              <span className="material-symbols-outlined text-[#2563eb] text-[20px] mt-0.5">
                history
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[14px] text-[#0f172a]">
                    {log.action}
                  </span>
                  <span className="text-[11px] font-mono text-[#64748b]">
                    {log.created_at}
                  </span>
                </div>
                <p className="text-[13px] text-[#475569] mt-0.5">
                  {log.description}
                </p>
                <span className="text-[11px] font-mono text-[#2563eb]">
                  Actor: {log.actor_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
